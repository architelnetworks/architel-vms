import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { FrigateConfig } from "@/types/frigateConfig";
import { useUserPersistence } from "@/hooks/use-user-persistence";

/** Keep live camera groups shareable while retaining per-user preferences. */
export function useCameraGroup(): [
  string,
  (value: string | undefined, replace?: boolean) => void,
  boolean,
  () => void,
] {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: config } = useSWR<FrigateConfig>("config");
  const [savedGroup, saveGroup, loaded, deleteGroup] =
    useUserPersistence<string>("cameraGroup", "default");
  const queryGroup = new URLSearchParams(location.search).get("group");
  const candidate =
    queryGroup ?? location.state?.cameraGroup ?? savedGroup ?? "default";
  const group =
    config &&
    candidate !== "default" &&
    !Object.prototype.hasOwnProperty.call(config.camera_groups ?? {}, candidate)
      ? "default"
      : candidate;

  const setGroup = useCallback(
    (value: string | undefined, replace = false) => {
      const nextGroup = value ?? "default";
      const params = new URLSearchParams(location.search);
      params.set("group", nextGroup);
      saveGroup(nextGroup);
      if (queryGroup === nextGroup && !location.hash) return;
      navigate(`${location.pathname}?${params}`, {
        state: { ...location.state, cameraGroup: nextGroup },
        replace,
      });
    },
    [location, navigate, queryGroup, saveGroup],
  );

  useEffect(() => {
    if (!loaded || !config || location.pathname !== "/") return;
    if (savedGroup !== group) saveGroup(group);
    if (queryGroup !== group) {
      const params = new URLSearchParams(location.search);
      params.set("group", group);
      navigate(`${location.pathname}?${params}${location.hash}`, {
        state: { ...location.state, cameraGroup: group },
        replace: true,
      });
    }
  }, [
    config,
    group,
    loaded,
    location,
    navigate,
    queryGroup,
    savedGroup,
    saveGroup,
  ]);

  return [group, setGroup, loaded && !!config, deleteGroup];
}
