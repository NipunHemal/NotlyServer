package lk.hemal.notly.service;

import lk.hemal.notly.dto.response.WorkspaceResponse;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.entity.Workspace;

import java.util.List;
import java.util.UUID;

public interface WorkspaceService {

    Workspace getOrCreateDefaultWorkspace(User user);

    Workspace getWorkspaceByIdAndOwner(UUID workspaceId, User user);

    List<WorkspaceResponse> getWorkspacesByOwner(User user);

    WorkspaceResponse getWorkspaceResponseById(UUID workspaceId, User user);
}
