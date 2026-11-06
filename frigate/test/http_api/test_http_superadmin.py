"""Engineering role inheritance and account protection tests."""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import Depends
from pydantic import ValidationError
from starlette.requests import Request

from frigate.api.app import _protected_auth_config_response
from frigate.api.auth import require_superadmin
from frigate.comms.ws import _check_ws_authorization
from frigate.config import AuthConfig, ProxyConfig
from frigate.const import JWT_SECRET_ENV_VAR
from frigate.models import User
from frigate.test.http_api.base_http_test import AuthTestClient, BaseTestHttp


@patch.dict(os.environ, {JWT_SECRET_ENV_VAR: "superadmin-test-secret"})
class TestHttpSuperadmin(BaseTestHttp):
    def setUp(self):
        super().setUp([User])
        self.app = super().create_app()
        self.app.config_publisher = MagicMock()
        for name, role in (("engineer", "superadmin"), ("operator", "viewer")):
            User.create(
                username=name, role=role, password_hash="unused", notification_tokens=[]
            )

        @self.app.get("/engineering-test", dependencies=[Depends(require_superadmin())])
        def engineering_test():
            return {"success": True}

        self.app.router.routes.insert(0, self.app.router.routes.pop())

    def request(self, method, path, role, **kwargs):
        with AuthTestClient(self.app) as client:
            return client.request(
                method,
                path,
                headers={
                    "remote-user": "engineer" if role == "superadmin" else "admin",
                    "remote-role": role,
                },
                **kwargs,
            )

    def test_superadmin_inherits_admin_endpoints(self):
        self.assertEqual(self.request("GET", "/users", "superadmin").status_code, 200)

    def test_engineering_endpoint_requires_superadmin(self):
        for role, expected in (("superadmin", 200), ("admin", 403), ("viewer", 403)):
            with self.subTest(role=role):
                self.assertEqual(
                    self.request("GET", "/engineering-test", role).status_code, expected
                )

    def test_admin_cannot_create_superadmin(self):
        response = self.request(
            "POST",
            "/users",
            "admin",
            json={
                "username": "new",
                "password": "Long-enough-password1!",
                "role": "superadmin",
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.select().where(User.username == "new").exists())

    def test_admin_cannot_promote_user(self):
        self.assertEqual(
            self.request(
                "PUT", "/users/operator/role", "admin", json={"role": "superadmin"}
            ).status_code,
            403,
        )
        self.assertEqual(User.get_by_id("operator").role, "viewer")

    def test_admin_cannot_modify_superadmin(self):
        for method, path, body in (
            ("DELETE", "/users/engineer", None),
            ("PUT", "/users/engineer/role", {"role": "viewer"}),
            ("PUT", "/users/engineer/password", {"password": "Long-enough-password1!"}),
        ):
            with self.subTest(path=path):
                self.assertEqual(
                    self.request(method, path, "admin", json=body).status_code, 403
                )
        self.assertEqual(User.get_by_id("engineer").role, "superadmin")

    def test_last_superadmin_cannot_be_deleted_or_demoted(self):
        self.assertEqual(
            self.request("DELETE", "/users/engineer", "superadmin").status_code, 403
        )
        self.assertEqual(
            self.request(
                "PUT", "/users/engineer/role", "superadmin", json={"role": "admin"}
            ).status_code,
            403,
        )

    def test_superadmin_can_promote_user(self):
        self.assertEqual(
            self.request(
                "PUT", "/users/operator/role", "superadmin", json={"role": "superadmin"}
            ).status_code,
            200,
        )
        self.assertEqual(User.get_by_id("operator").role, "superadmin")

    def test_superadmin_can_send_admin_commands(self):
        self.assertTrue(_check_ws_authorization("restart", "superadmin", ","))

    def test_superadmin_is_reserved_and_unrestricted(self):
        self.assertEqual(AuthConfig().roles["superadmin"], [])
        for role in ("superadmin", "SUPERADMIN"):
            with self.assertRaises(ValidationError):
                AuthConfig(roles={role: ["front_door"]})

    def test_site_admin_cannot_change_authentication_trust(self):
        request = Request(
            {"type": "http", "headers": [(b"remote-role", b"admin")], "app": self.app}
        )
        config = self.app.frigate_config.model_copy(deep=True)
        config.auth.enabled = not config.auth.enabled
        self.assertEqual(
            _protected_auth_config_response(request, config).status_code, 403
        )
        config = self.app.frigate_config.model_copy(deep=True)
        config.proxy = ProxyConfig(default_role="superadmin")
        self.assertEqual(
            _protected_auth_config_response(request, config).status_code, 403
        )
        self.assertIsNone(
            _protected_auth_config_response(request, self.app.frigate_config)
        )

    def test_protected_config_updates_are_rejected_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            config_path = Path(directory) / "config.yml"
            original = "mqtt: {host: mqtt}\ncameras: {}\n"
            config_path.write_text(original)
            with patch(
                "frigate.api.app.find_config_file", return_value=str(config_path)
            ):
                for key, value in (
                    ("auth", {"enabled": False}),
                    ("proxy", {"default_role": "superadmin"}),
                    ("environment_vars", {"TEST_VARIABLE": "value"}),
                ):
                    with self.subTest(key=key):
                        response = self.request(
                            "PUT",
                            "/config/set",
                            "admin",
                            json={"config_data": {key: value}},
                        )
                        self.assertEqual(response.status_code, 403)
                        self.assertEqual(config_path.read_text(), original)

    def test_raw_config_cannot_disable_authentication(self):
        config = {**self.minimal_config, "auth": {"enabled": False}}
        response = self.request(
            "POST",
            "/config/save?save_option=saveonly",
            "admin",
            content=json.dumps(config),
        )
        self.assertEqual(response.status_code, 403)
