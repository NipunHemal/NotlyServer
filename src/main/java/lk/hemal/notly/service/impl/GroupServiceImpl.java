package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.*;
import lk.hemal.notly.dto.response.*;
import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.BinItem;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.GroupCollaborator;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.entity.Workspace;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.mapper.GroupMapper;
import lk.hemal.notly.mapper.NoteMapper;
import lk.hemal.notly.mapper.UserMapper;
import lk.hemal.notly.repo.ActivityLogRepo;
import lk.hemal.notly.repo.BinItemRepo;
import lk.hemal.notly.repo.GroupCollaboratorRepo;
import lk.hemal.notly.repo.GroupRepo;
import lk.hemal.notly.repo.NoteRepo;
import lk.hemal.notly.repo.UserRepo;
import lk.hemal.notly.service.ActivityLogService;
import lk.hemal.notly.service.GroupService;
import lk.hemal.notly.service.LockAttemptService;
import lk.hemal.notly.service.WorkspaceService;
import lk.hemal.notly.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupRepo groupRepo;
    private final NoteRepo noteRepo;
    private final BinItemRepo binItemRepo;
    private final GroupCollaboratorRepo groupCollaboratorRepo;
    private final UserRepo userRepo;
    private final WorkspaceService workspaceService;
    private final GroupMapper groupMapper;
    private final NoteMapper noteMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ActivityLogService activityLogService;
    private final LockAttemptService lockAttemptService;

    @Override
    @Transactional
    public GroupResponse createGroup(CreateGroupRequest req, User user) {
        Workspace workspace;
        Group parent = null;

        if (req.getParentId() != null) {
            parent = requireOwnedGroup(req.getParentId(), user);
            workspace = parent.getWorkspace();
        } else {
            workspace = workspaceService.getOrCreateDefaultWorkspace(user);
        }

        if (req.getIsSecure() != null && req.getIsSecure() && (req.getPassword() == null || req.getPassword().length() < 6)) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "Password is required (min 6 characters) for secure groups");
        }

        Group group = new Group();
        group.setWorkspace(workspace);
        group.setParent(parent);
        group.setName(req.getName());
        group.setSortOrder(groupRepo.maxSortOrderAmongSiblings(req.getParentId()) + 1);
        group.setVisibility(Group.Visibility.PRIVATE);

        if (req.getPassword() != null && !req.getPassword().isEmpty()) {
            group.setLocked(true);
            group.setLockPasswordHash(passwordEncoder.encode(req.getPassword()));
            if (req.getIsSecure() != null && req.getIsSecure()) {
                group.setSecure(true);
            }
        }

        group = groupRepo.save(group);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.GROUP,
                group.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.CREATED,
                Map.of("name", group.getName(), "parent_id", parent != null ? parent.getId() : "Root"));

        log.info("[GROUP] Created id={} name={} user={}", group.getId(), group.getName(), user.getId());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public GroupResponse getGroupById(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public GroupChildrenResponse getGroupChildren(UUID groupId, User user, String unlockToken) {
        Group group = requireOwnedGroup(groupId, user);

        if (group.isLocked() || group.isSecure()) {
            if (unlockToken == null || !jwtUtil.isUnlockTokenValid(unlockToken, user.getId().toString(),
                    "GROUP", group.getId().toString())) {
                throw new NotlyException(ErrorCode.ITEM_LOCKED, "This group is locked. Provide a valid unlock token.");
            }
        }

        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(groupId);
        List<GroupResponse> childResponses = children.stream()
                .map(groupMapper::toResponse)
                .collect(Collectors.toList());

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(groupId);
        List<NoteSummaryResponse> noteResponses = notes.stream()
                .filter(n -> n.getStatus() == Note.NoteStatus.ACTIVE)
                .map(noteMapper::toSummaryResponse)
                .collect(Collectors.toList());

        return new GroupChildrenResponse(childResponses, noteResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupTreeNode> getGroupTree(User user, UUID workspaceId) {
        List<Group> allGroups;
        if (workspaceId != null) {
            allGroups = groupRepo.findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc(workspaceId);
        } else {
            Workspace workspace = workspaceService.getOrCreateDefaultWorkspace(user);
            allGroups = groupRepo.findByWorkspaceOwnerIdOrderBySortOrderAsc(user.getId());
        }

        Map<UUID, List<Group>> childrenByParent = allGroups.stream()
                .filter(g -> g.getParent() != null)
                .collect(Collectors.groupingBy(g -> g.getParent().getId()));

        List<Group> roots = allGroups.stream()
                .filter(g -> g.getParent() == null)
                .collect(Collectors.toList());

        return roots.stream()
                .map(root -> buildTreeNode(root, childrenByParent))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BreadcrumbItem> getBreadcrumb(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        List<BreadcrumbItem> breadcrumb = new ArrayList<>();

        Group current = group;
        while (current != null) {
            breadcrumb.add(0, new BreadcrumbItem(current.getId(), current.getName()));
            current = current.getParent();
        }

        return breadcrumb;
    }

    @Override
    @Transactional
    public GroupResponse updateGroup(UUID groupId, UpdateGroupRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (req.getName() == null || req.getName().isBlank()) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "Group name is required");
        }

        String oldName = group.getName();
        group.setName(req.getName());
        group = groupRepo.save(group);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.GROUP,
                group.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UPDATED,
                Map.of("old_name", oldName, "new_name", group.getName()));

        log.info("[GROUP] Updated id={} name='{}' -> '{}'", group.getId(), oldName, group.getName());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public GroupStatsResponse getGroupStats(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);

        long directNoteCount = noteRepo.countByGroupId(groupId);
        long directSubgroupCount = groupRepo.countByParentId(groupId);

        List<Group> allGroups = groupRepo.findByWorkspaceOwnerIdOrderBySortOrderAsc(user.getId());
        long totalNoteCount = countNotesRecursive(groupId, allGroups);

        return new GroupStatsResponse(directNoteCount, directSubgroupCount, totalNoteCount, group.getUpdatedAt());
    }

    @Override
    @Transactional
    public GroupResponse moveGroup(UUID groupId, MoveGroupRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);
        assertNotRoot(group);

        Group newParent = null;
        if (req.getTargetParentId() != null) {
            newParent = requireOwnedGroup(req.getTargetParentId(), user);

            if (!group.getWorkspace().getId().equals(newParent.getWorkspace().getId())) {
                throw new NotlyException(ErrorCode.BAD_REQUEST, "Cannot move group to a different workspace");
            }

            if (isSelfOrDescendant(groupId, req.getTargetParentId())) {
                throw new NotlyException(ErrorCode.CIRCULAR_GROUP_REFERENCE);
            }
        }

        UUID oldParentId = group.getParent() != null ? group.getParent().getId() : null;
        group.setParent(newParent);

        int newSortOrder = req.getSortOrder() != null
                ? req.getSortOrder()
                : groupRepo.maxSortOrderAmongSiblings(req.getTargetParentId()) + 1;
        group.setSortOrder(newSortOrder);

        group = groupRepo.save(group);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.GROUP,
                group.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UPDATED,
                Map.of("from_parent", oldParentId, "to_parent", req.getTargetParentId()));

        log.info("[GROUP] Moved id={} from {} to {}", group.getId(), oldParentId, req.getTargetParentId());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional
    public GroupResponse reorderGroup(UUID groupId, Integer sortOrder, User user) {
        Group group = requireOwnedGroup(groupId, user);
        group.setSortOrder(sortOrder);
        group = groupRepo.save(group);

        log.info("[GROUP] Reordered id={} sortOrder={}", group.getId(), sortOrder);
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional
    public GroupResponse duplicateGroup(UUID groupId, DuplicateGroupRequest req, User user) {
        Group original = requireOwnedGroup(groupId, user);

        Group targetParent = null;
        if (req.getTargetParentId() != null) {
            targetParent = requireOwnedGroup(req.getTargetParentId(), user);
        } else {
            targetParent = original.getParent();
        }

        Group copy = duplicateGroupRecursive(original, targetParent, user, 0);

        log.info("[GROUP] Duplicated id={} -> new id={}", original.getId(), copy.getId());
        return groupMapper.toResponse(copy);
    }

    // ── Private Helpers ────────────────────────────────────────

    private Group requireOwnedGroup(UUID groupId, User user) {
        return groupRepo.findByIdAndWorkspaceOwnerId(groupId, user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.GROUP_NOT_FOUND,
                        "Group " + groupId + " not found"));
    }

    protected void assertNotRoot(Group group) {
        if (group.getParent() == null) {
            throw new NotlyException(ErrorCode.ROOT_GROUP_PROTECTED,
                    "The root group cannot be moved, deleted, or archived");
        }
    }

    private GroupTreeNode buildTreeNode(Group group, Map<UUID, List<Group>> childrenByParent) {
        GroupTreeNode node = new GroupTreeNode();
        node.setId(group.getId());
        node.setName(group.getName());
        node.setLocked(group.isLocked());
        node.setSecure(group.isSecure());
        node.setFavorite(group.isFavorite());
        node.setArchived(group.isArchived());
        node.setSortOrder(group.getSortOrder());

        List<Group> children = childrenByParent.getOrDefault(group.getId(), Collections.emptyList());
        node.setChildren(children.stream()
                .map(child -> buildTreeNode(child, childrenByParent))
                .collect(Collectors.toList()));

        return node;
    }

    private long countNotesRecursive(UUID groupId, List<Group> allGroups) {
        long count = noteRepo.countByGroupId(groupId);

        List<Group> children = allGroups.stream()
                .filter(g -> g.getParent() != null && g.getParent().getId().equals(groupId))
                .collect(Collectors.toList());

        for (Group child : children) {
            count += countNotesRecursive(child.getId(), allGroups);
        }

        return count;
    }

    private boolean isSelfOrDescendant(UUID nodeId, UUID candidateAncestorId) {
        if (nodeId.equals(candidateAncestorId)) return true;

        Group current = groupRepo.findById(nodeId).orElse(null);
        while (current != null && current.getParent() != null) {
            if (current.getParent().getId().equals(candidateAncestorId)) return true;
            current = groupRepo.findById(current.getParent().getId()).orElse(null);
        }
        return false;
    }

    private Group duplicateGroupRecursive(Group original, Group targetParent, User user, int depth) {
        if (depth > 50) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "Group hierarchy too deep (max 50 levels)");
        }

        Group copy = new Group();
        copy.setWorkspace(original.getWorkspace());
        copy.setParent(targetParent);
        copy.setName(original.getName() + " (copy)");
        copy.setSortOrder(groupRepo.maxSortOrderAmongSiblings(targetParent != null ? targetParent.getId() : null) + 1);
        copy.setVisibility(Group.Visibility.PRIVATE);
        copy.setLocked(false);
        copy.setSecure(false);
        copy.setFavorite(false);
        copy = groupRepo.save(copy);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.GROUP,
                copy.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.CREATED,
                Map.of("original_id", original.getId(), "name", copy.getName()));

        List<Note> originalNotes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(original.getId());
        for (Note note : originalNotes) {
            Note noteCopy = new Note();
            noteCopy.setGroup(copy);
            noteCopy.setOwner(user);
            noteCopy.setTitle(note.getTitle() + " (copy)");
            noteCopy.setContent(note.getContent());
            noteCopy.setStatus(Note.NoteStatus.ACTIVE);
            noteCopy.setVisibility(Note.Visibility.PRIVATE);
            noteCopy.setLocked(false);
            noteCopy.setFavorite(false);
            noteCopy.setSortOrder(noteRepo.maxSortOrderInGroup(copy.getId()) + 1);
            noteRepo.save(noteCopy);
        }

        List<Group> originalChildren = groupRepo.findByParentIdOrderBySortOrderAsc(original.getId());
        for (Group child : originalChildren) {
            duplicateGroupRecursive(child, copy, user, depth + 1);
        }

        return copy;
    }

    private void archiveGroupRecursive(Group group, User user) {
        group.setArchived(true);
        group.setArchivedAt(java.time.LocalDateTime.now());
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.ARCHIVED, null);

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(group.getId());
        for (Note note : notes) {
            note.setStatus(Note.NoteStatus.ARCHIVED);
            note.setArchivedAt(java.time.LocalDateTime.now());
            noteRepo.save(note);

            activityLogService.log(user.getId(), ActivityLog.EntityType.NOTE,
                    note.getId(), ActivityLog.ActivityAction.ARCHIVED, null);
        }

        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(group.getId());
        for (Group child : children) {
            archiveGroupRecursive(child, user);
        }
    }

    private void unarchiveGroupRecursive(Group group, User user) {
        group.setArchived(false);
        group.setArchivedAt(null);
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.RESTORED, null);

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(group.getId());
        for (Note note : notes) {
            if (note.getStatus() == Note.NoteStatus.ARCHIVED) {
                note.setStatus(Note.NoteStatus.ACTIVE);
                note.setArchivedAt(null);
                noteRepo.save(note);

                activityLogService.log(user.getId(), ActivityLog.EntityType.NOTE,
                        note.getId(), ActivityLog.ActivityAction.RESTORED, null);
            }
        }

        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(group.getId());
        for (Group child : children) {
            unarchiveGroupRecursive(child, user);
        }
    }

    private void softDeleteGroupRecursive(Group group, User user) {
        group.softDelete();
        groupRepo.save(group);

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(group.getId());
        for (Note note : notes) {
            note.softDelete();
            noteRepo.save(note);
        }

        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(group.getId());
        for (Group child : children) {
            softDeleteGroupRecursive(child, user);
        }
    }

    @Override
    @Transactional
    public GroupResponse archiveGroup(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        assertNotRoot(group);

        archiveGroupRecursive(group, user);

        log.info("[GROUP] Archived id={} user={}", group.getId(), user.getId());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional
    public GroupResponse unarchiveGroup(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        unarchiveGroupRecursive(group, user);

        log.info("[GROUP] Unarchived id={} user={}", group.getId(), user.getId());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional
    public void softDeleteGroup(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        assertNotRoot(group);

        softDeleteGroupRecursive(group, user);

        BinItem binItem = new BinItem();
        binItem.setOwner(user);
        binItem.setEntityType(BinItem.EntityType.GROUP);
        binItem.setEntityId(group.getId());
        binItem.setRestoreDeadline(java.time.LocalDateTime.now().plusDays(30));
        binItemRepo.save(binItem);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.DELETED, null);

        log.info("[GROUP] Soft-deleted id={} user={}", group.getId(), user.getId());
    }

    @Override
    @Transactional
    public void lockGroup(UUID groupId, LockRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (group.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_ALREADY_LOCKED);
        }

        group.setLocked(true);
        group.setLockPasswordHash(passwordEncoder.encode(req.getPassword()));

        if (req.getMakeSecure() != null && req.getMakeSecure()) {
            group.setSecure(true);
        }

        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.LOCKED, null);

        log.info("[GROUP] Locked id={} user={}", group.getId(), user.getId());
    }

    @Override
    @Transactional
    public UnlockTokenResponse unlockGroup(UUID groupId, UnlockRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (!group.isLocked() && !group.isSecure()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "GROUP:" + groupId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getPassword(), group.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        lockAttemptService.recordSuccess(key);

        String unlockToken = jwtUtil.generateUnlockToken(user.getId().toString(), "GROUP", groupId.toString());

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.UNLOCKED, null);

        log.info("[GROUP] Unlocked id={} user={}", group.getId(), user.getId());
        return new UnlockTokenResponse(unlockToken, 7200);
    }

    @Override
    @Transactional
    public void changeGroupLockPassword(UUID groupId, ChangeLockRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (!group.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "GROUP:" + groupId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getCurrentPassword(), group.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        group.setLockPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        groupRepo.save(group);

        lockAttemptService.recordSuccess(key);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.UPDATED,
                Map.of("lock", "password_changed"));

        log.info("[GROUP] Lock password changed id={} user={}", group.getId(), user.getId());
    }

    @Override
    @Transactional
    public void removeGroupLock(UUID groupId, UnlockRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (!group.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "GROUP:" + groupId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getPassword(), group.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        group.setLocked(false);
        group.setLockPasswordHash(null);
        group.setSecure(false);
        groupRepo.save(group);

        lockAttemptService.recordSuccess(key);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.UNLOCKED, null);

        log.info("[GROUP] Lock removed id={} user={}", group.getId(), user.getId());
    }

    @Override
    @Transactional
    public ShareLinkResponse createPublicLink(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);

        if (group.isLocked() || group.isSecure()) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "Cannot share a locked/secure group publicly");
        }

        String shareToken = UUID.randomUUID().toString();
        group.setShareToken(shareToken);
        group.setVisibility(Group.Visibility.PUBLIC);
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.SHARED, null);

        log.info("[GROUP] Public link created id={} user={}", group.getId(), user.getId());
        return new ShareLinkResponse(shareToken, "/api/v1/groups/public/" + shareToken);
    }

    @Override
    @Transactional
    public ShareLinkResponse regeneratePublicLink(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);

        String shareToken = UUID.randomUUID().toString();
        group.setShareToken(shareToken);
        group.setVisibility(Group.Visibility.PUBLIC);
        groupRepo.save(group);

        log.info("[GROUP] Public link regenerated id={} user={}", group.getId(), user.getId());
        return new ShareLinkResponse(shareToken, "/api/v1/groups/public/" + shareToken);
    }

    @Override
    @Transactional
    public void revokePublicLink(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);

        group.setShareToken(null);
        group.setVisibility(Group.Visibility.PRIVATE);
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.UNSHARED, null);

        log.info("[GROUP] Public link revoked id={} user={}", group.getId(), user.getId());
    }

    @Override
    @Transactional
    public GroupCollaboratorResponse shareGroupWithEmail(UUID groupId, ShareGroupRequest req, User user) {
        Group group = requireOwnedGroup(groupId, user);

        User targetUser = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new NotlyException(ErrorCode.SHARE_TARGET_NOT_FOUND,
                        "No registered user with email " + req.getEmail()));

        if (targetUser.getId().equals(user.getId())) {
            throw new NotlyException(ErrorCode.CANNOT_SHARE_WITH_SELF);
        }

        if (groupCollaboratorRepo.existsByGroupIdAndUserId(groupId, targetUser.getId())) {
            throw new NotlyException(ErrorCode.ALREADY_SHARED);
        }

        GroupCollaborator.Role role = req.getRole() != null ? req.getRole() : GroupCollaborator.Role.VIEWER;
        if (role == GroupCollaborator.Role.OWNER) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "Cannot assign OWNER role via sharing");
        }

        GroupCollaborator collaborator = new GroupCollaborator();
        collaborator.setGroup(group);
        collaborator.setUser(targetUser);
        collaborator.setRole(role);
        collaborator.setAcceptedAt(java.time.LocalDateTime.now());
        groupCollaboratorRepo.save(collaborator);

        group.setVisibility(Group.Visibility.SHARED);
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.SHARED,
                Map.of("with", targetUser.getId(), "role", role.name()));

        log.info("[GROUP] Shared id={} with user={} role={}", group.getId(), targetUser.getId(), role);
        return toCollaboratorResponse(collaborator);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupCollaboratorResponse> getGroupCollaborators(UUID groupId, User user) {
        requireOwnedGroup(groupId, user);

        return groupCollaboratorRepo.findByGroupId(groupId).stream()
                .map(this::toCollaboratorResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GroupCollaboratorResponse updateCollaboratorRole(UUID groupId, UUID userId, UpdateCollaboratorRoleRequest req, User user) {
        requireOwnedGroup(groupId, user);

        GroupCollaborator collaborator = groupCollaboratorRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.COLLABORATOR_NOT_FOUND));

        if (req.getRole() == GroupCollaborator.Role.OWNER) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "Cannot assign OWNER role");
        }

        collaborator.setRole(req.getRole());
        groupCollaboratorRepo.save(collaborator);

        log.info("[GROUP] Collaborator role updated group={} user={} role={}", groupId, userId, req.getRole());
        return toCollaboratorResponse(collaborator);
    }

    @Override
    @Transactional
    public void removeCollaborator(UUID groupId, UUID userId, User user) {
        Group group = requireOwnedGroup(groupId, user);

        groupCollaboratorRepo.deleteByGroupIdAndUserId(groupId, userId);

        long remainingCollaborators = groupCollaboratorRepo.findByGroupId(groupId).size();
        if (remainingCollaborators == 0 && group.getVisibility() == Group.Visibility.SHARED) {
            group.setVisibility(Group.Visibility.PRIVATE);
            groupRepo.save(group);
        }

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.UNSHARED, null);

        log.info("[GROUP] Collaborator removed group={} user={}", groupId, userId);
    }

    private GroupCollaboratorResponse toCollaboratorResponse(GroupCollaborator collab) {
        return new GroupCollaboratorResponse(
                collab.getId(),
                collab.getRole().name(),
                collab.getInvitedAt(),
                userMapper.toDto(collab.getUser())
        );
    }

    @Override
    @Transactional
    public GroupResponse toggleFavorite(UUID groupId, User user) {
        Group group = requireOwnedGroup(groupId, user);
        group.setFavorite(!group.isFavorite());
        groupRepo.save(group);

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                group.getId(), ActivityLog.ActivityAction.FAVORITED, null);

        log.info("[GROUP] Toggled favorite id={} favorite={} user={}", group.getId(), group.isFavorite(), user.getId());
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupResponse> getFavoriteGroups(User user) {
        return groupRepo.findByWorkspaceOwnerIdOrderBySortOrderAsc(user.getId()).stream()
                .filter(Group::isFavorite)
                .map(groupMapper::toResponse)
                .collect(Collectors.toList());
    }
}
