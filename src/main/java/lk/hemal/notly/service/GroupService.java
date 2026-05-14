package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.*;
import lk.hemal.notly.dto.response.*;
import lk.hemal.notly.dto.response.UnlockTokenResponse;
import lk.hemal.notly.entity.User;

import java.util.List;
import java.util.UUID;

public interface GroupService {

    GroupResponse createGroup(CreateGroupRequest req, User user);

    GroupResponse getGroupById(UUID groupId, User user);

    GroupChildrenResponse getGroupChildren(UUID groupId, User user, String unlockToken);

    List<GroupTreeNode> getGroupTree(User user, UUID workspaceId);

    List<BreadcrumbItem> getBreadcrumb(UUID groupId, User user);

    GroupResponse updateGroup(UUID groupId, UpdateGroupRequest req, User user);

    GroupStatsResponse getGroupStats(UUID groupId, User user);

    GroupResponse moveGroup(UUID groupId, MoveGroupRequest req, User user);

    GroupResponse reorderGroup(UUID groupId, Integer sortOrder, User user);

    GroupResponse duplicateGroup(UUID groupId, DuplicateGroupRequest req, User user);

    GroupResponse archiveGroup(UUID groupId, User user);

    GroupResponse unarchiveGroup(UUID groupId, User user);

    void softDeleteGroup(UUID groupId, User user);

    void lockGroup(UUID groupId, LockRequest req, User user);

    UnlockTokenResponse unlockGroup(UUID groupId, UnlockRequest req, User user);

    void changeGroupLockPassword(UUID groupId, ChangeLockRequest req, User user);

    void removeGroupLock(UUID groupId, UnlockRequest req, User user);

    ShareLinkResponse createPublicLink(UUID groupId, User user);

    ShareLinkResponse regeneratePublicLink(UUID groupId, User user);

    void revokePublicLink(UUID groupId, User user);

    GroupCollaboratorResponse shareGroupWithEmail(UUID groupId, ShareGroupRequest req, User user);

    List<GroupCollaboratorResponse> getGroupCollaborators(UUID groupId, User user);

    GroupCollaboratorResponse updateCollaboratorRole(UUID groupId, UUID userId, UpdateCollaboratorRoleRequest req, User user);

    void removeCollaborator(UUID groupId, UUID userId, User user);

    GroupResponse toggleFavorite(UUID groupId, User user);

    List<GroupResponse> getFavoriteGroups(User user);
}
