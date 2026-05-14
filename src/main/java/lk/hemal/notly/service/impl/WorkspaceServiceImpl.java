package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.response.WorkspaceResponse;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.entity.Workspace;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.repo.GroupRepo;
import lk.hemal.notly.repo.WorkspaceRepo;
import lk.hemal.notly.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepo workspaceRepo;
    private final GroupRepo groupRepo;

    @Override
    @Transactional
    public Workspace getOrCreateDefaultWorkspace(User user) {
        return workspaceRepo.findFirstByOwnerIdOrderByCreatedAtAsc(user.getId())
                .orElseGet(() -> createDefaultWorkspace(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Workspace getWorkspaceByIdAndOwner(UUID workspaceId, User user) {
        return workspaceRepo.findById(workspaceId)
                .filter(ws -> ws.getOwner().getId().equals(user.getId()))
                .orElseThrow(() -> new NotlyException(ErrorCode.WORKSPACE_NOT_FOUND,
                        "Workspace not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getWorkspacesByOwner(User user) {
        return workspaceRepo.findByOwnerId(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceResponseById(UUID workspaceId, User user) {
        Workspace workspace = getWorkspaceByIdAndOwner(workspaceId, user);
        return toResponse(workspace);
    }

    private Workspace createDefaultWorkspace(User user) {
        log.info("[WORKSPACE] Creating default workspace for user id={}", user.getId());

        Workspace workspace = new Workspace();
        workspace.setOwner(user);
        workspace.setName("My Workspace");
        workspace.setPublic(false);
        workspace = workspaceRepo.save(workspace);

        Group rootGroup = new Group();
        rootGroup.setWorkspace(workspace);
        rootGroup.setParent(null);
        rootGroup.setName("Workspace");
        rootGroup.setSortOrder(0);
        groupRepo.save(rootGroup);

        log.info("[WORKSPACE] Default workspace created with root group for user id={}", user.getId());
        return workspace;
    }

    private WorkspaceResponse toResponse(Workspace ws) {
        return new WorkspaceResponse(ws.getId(), ws.getName(), ws.isPublic(), ws.getCreatedAt());
    }
}
