package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.request.CreateGroupRequest;
import lk.hemal.notly.dto.request.DuplicateGroupRequest;
import lk.hemal.notly.dto.request.MoveGroupRequest;
import lk.hemal.notly.dto.request.ReorderRequest;
import lk.hemal.notly.dto.request.ShareGroupRequest;
import lk.hemal.notly.dto.request.UpdateCollaboratorRoleRequest;
import lk.hemal.notly.dto.request.UpdateGroupRequest;
import lk.hemal.notly.dto.response.*;
import lk.hemal.notly.dto.response.GroupCollaboratorResponse;
import lk.hemal.notly.dto.response.PublicGroupResponse;
import lk.hemal.notly.dto.response.ShareLinkResponse;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.GroupService;
import lk.hemal.notly.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/groups")
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Group (folder) management endpoints")
public class GroupController {

    private final GroupService groupService;
    private final NoteService noteService;

    @Operation(
            summary = "Create a new group",
            description = "Creates a new group (folder). If parent_id is null, creates at root level of the default workspace."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Group created successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(req, user));
    }

    @Operation(
            summary = "Get group by ID",
            description = "Returns group metadata. Does not require unlock token for metadata-only access."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupById(id, user));
    }

    @Operation(
            summary = "Get group children",
            description = "Returns direct child groups and notes. Requires unlock token if the group is locked/secure."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Children retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GroupChildrenResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Group is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/children")
    public ResponseEntity<GroupChildrenResponse> getGroupChildren(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Unlock-Token", required = false) String unlockToken,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupChildren(id, user, unlockToken));
    }

    @Operation(
            summary = "Get group tree",
            description = "Returns the full nested group tree for the user's default workspace."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tree retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GroupTreeNode.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/tree")
    public ResponseEntity<List<GroupTreeNode>> getGroupTree(
            @RequestParam(required = false) UUID workspace_id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupTree(user, workspace_id));
    }

    @Operation(
            summary = "Get group breadcrumb",
            description = "Returns the path from root to the specified group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Breadcrumb retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/breadcrumb")
    public ResponseEntity<List<BreadcrumbItem>> getBreadcrumb(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getBreadcrumb(id, user));
    }

    @Operation(
            summary = "Rename group",
            description = "Updates the group name. Root group can be renamed."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group updated successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.updateGroup(id, req, user));
    }

    @Operation(
            summary = "Get group statistics",
            description = "Returns note counts and activity info for the group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stats retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GroupStatsResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/stats")
    public ResponseEntity<GroupStatsResponse> getGroupStats(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupStats(id, user));
    }

    @Operation(
            summary = "Move group",
            description = "Moves a group to a new parent. Cannot move root group or create circular references."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group moved successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid move (circular reference, root protected)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/move")
    public ResponseEntity<GroupResponse> moveGroup(
            @PathVariable UUID id,
            @Valid @RequestBody MoveGroupRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.moveGroup(id, req, user));
    }

    @Operation(
            summary = "Reorder group",
            description = "Changes the sort order of a group among its siblings."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group reordered successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/reorder")
    public ResponseEntity<GroupResponse> reorderGroup(
            @PathVariable UUID id,
            @Valid @RequestBody ReorderRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.reorderGroup(id, req.getSortOrder(), user));
    }

    @Operation(
            summary = "Duplicate group",
            description = "Creates a deep copy of a group including all descendant groups and notes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Group duplicated successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Hierarchy too deep",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<GroupResponse> duplicateGroup(
            @PathVariable UUID id,
            @RequestBody DuplicateGroupRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.duplicateGroup(id, req, user));
    }

    @Operation(
            summary = "Archive group",
            description = "Archives a group and all its descendants recursively. Root group cannot be archived."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group archived successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "400", description = "Root group protected",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/archive")
    public ResponseEntity<GroupResponse> archiveGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.archiveGroup(id, user));
    }

    @Operation(
            summary = "Unarchive group",
            description = "Unarchives a group and all its archived descendants."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group unarchived successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/unarchive")
    public ResponseEntity<GroupResponse> unarchiveGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.unarchiveGroup(id, user));
    }

    @Operation(
            summary = "Delete group (soft delete)",
            description = "Soft-deletes a group and its entire subtree. Moves to bin for 30-day restore window. Root group cannot be deleted."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Group soft-deleted"),
            @ApiResponse(responseCode = "400", description = "Root group protected",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        groupService.softDeleteGroup(id, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Create public link for group",
            description = "Generates a public shareable link for the group. Cannot be done on locked/secure groups."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Public link created",
                    content = @Content(schema = @Schema(implementation = ShareLinkResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Group is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/public-link")
    public ResponseEntity<ShareLinkResponse> createPublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.createPublicLink(id, user));
    }

    @Operation(
            summary = "Regenerate public link",
            description = "Generates a new public link, invalidating the old one."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Public link regenerated",
                    content = @Content(schema = @Schema(implementation = ShareLinkResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/public-link/regenerate")
    public ResponseEntity<ShareLinkResponse> regeneratePublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.regeneratePublicLink(id, user));
    }

    @Operation(
            summary = "Revoke public link",
            description = "Removes the public link, making the group private again."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Public link revoked"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}/public-link")
    public ResponseEntity<Void> revokePublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        groupService.revokePublicLink(id, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Share group with user by email",
            description = "Shares the group with a registered user. Email sharing requires the target user to be registered."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Group shared successfully",
                    content = @Content(schema = @Schema(implementation = GroupCollaboratorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Cannot share with self or invalid role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Already shared",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/collaborators")
    public ResponseEntity<GroupCollaboratorResponse> shareGroup(
            @PathVariable UUID id,
            @Valid @RequestBody ShareGroupRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.shareGroupWithEmail(id, req, user));
    }

    @Operation(
            summary = "List group collaborators",
            description = "Returns all users with whom this group is shared."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collaborators retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GroupCollaboratorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/collaborators")
    public ResponseEntity<List<GroupCollaboratorResponse>> getCollaborators(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupCollaborators(id, user));
    }

    @Operation(
            summary = "Update collaborator role",
            description = "Changes the role of a collaborator (EDITOR or VIEWER)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role updated successfully",
                    content = @Content(schema = @Schema(implementation = GroupCollaboratorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Collaborator not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/collaborators/{userId}")
    public ResponseEntity<GroupCollaboratorResponse> updateCollaboratorRole(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateCollaboratorRoleRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.updateCollaboratorRole(id, userId, req, user));
    }

    @Operation(
            summary = "Remove collaborator",
            description = "Removes a user from the group's collaborators."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Collaborator removed"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Collaborator not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}/collaborators/{userId}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal User user) {
        groupService.removeCollaborator(id, userId, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Toggle group favorite",
            description = "Toggles the favorite status of a group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Favorite toggled successfully",
                    content = @Content(schema = @Schema(implementation = GroupResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/favorite")
    public ResponseEntity<GroupResponse> toggleFavorite(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.toggleFavorite(id, user));
    }
}

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/groups/public")
@Tag(name = "Public Groups", description = "Public group access endpoints (no auth required)")
@RequiredArgsConstructor
class PublicGroupController {

    private final GroupService groupService;
    private final NoteService noteService;

    @Operation(
            summary = "Get public group by share token",
            description = "Read-only access to a publicly shared group via share token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Group retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PublicGroupResponse.class))),
            @ApiResponse(responseCode = "404", description = "Invalid share token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{token}")
    public ResponseEntity<PublicGroupResponse> getPublicGroup(@PathVariable String token) {
        return ResponseEntity.ok(noteService.getPublicGroupByToken(token));
    }
}
