package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.request.CopyNoteRequest;
import lk.hemal.notly.dto.request.CreateNoteRequest;
import lk.hemal.notly.dto.request.MoveNoteRequest;
import lk.hemal.notly.dto.request.NoteAutosaveRequest;
import lk.hemal.notly.dto.request.UpdateNoteRequest;
import lk.hemal.notly.dto.response.NoteResponse;
import lk.hemal.notly.dto.response.NoteSummaryResponse;
import lk.hemal.notly.dto.response.NoteVersionResponse;
import lk.hemal.notly.dto.response.PublicNoteResponse;
import lk.hemal.notly.dto.response.ShareLinkResponse;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/notes")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "Note management endpoints")
public class NoteController {

    private final NoteService noteService;

    @Operation(
            summary = "Create a new note",
            description = "Creates a new note in the specified group. Defaults to 'Untitled' if no title is provided."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Note created successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Target group is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody CreateNoteRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(req, user));
    }

    @Operation(
            summary = "Get note by ID",
            description = "Returns full note details including content. Requires unlock token if the note or its group is locked."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note retrieved successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Note is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getNote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Unlock-Token", required = false) String unlockToken,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.getNoteById(id, user, unlockToken));
    }

    @Operation(
            summary = "List notes by group",
            description = "Returns active notes in a specific group as summaries (without content)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notes retrieved successfully",
                    content = @Content(schema = @Schema(implementation = NoteSummaryResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<NoteSummaryResponse>> listNotes(
            @RequestParam(required = false) UUID group_id,
            @RequestParam(required = false) Note.NoteStatus status,
            @RequestParam(required = false) Boolean favorite,
            @AuthenticationPrincipal User user) {

        List<NoteSummaryResponse> notes;

        if (favorite != null && favorite) {
            notes = noteService.getNotesByFavorite(user);
        } else if (status != null) {
            notes = noteService.getNotesByStatus(user, status);
        } else if (group_id != null) {
            notes = noteService.getNotesByGroupId(group_id, user);
        } else {
            notes = List.of();
        }

        return ResponseEntity.ok(notes);
    }

    @Operation(
            summary = "Update note (autosave)",
            description = "Partial update for autosave. Only provided fields are updated."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note updated successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or no fields provided",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Note is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNoteRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.updateNote(id, req, user));
    }

    @Operation(
            summary = "Autosave note",
            description = "Efficient autosave for editor content. Creates a snapshot only if content changed. Supports optimistic concurrency via clientVersion."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note autosaved successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "200", description = "Autosave skipped (no change)",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Note is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Concurrent modification detected",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/autosave")
    public ResponseEntity<NoteResponse> autosaveNote(
            @PathVariable UUID id,
            @Valid @RequestBody NoteAutosaveRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.autosaveNote(id, req, user));
    }

    @Operation(
            summary = "Get note version history",
            description = "Returns paginated snapshot history for a note."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Version history retrieved",
                    content = @Content(schema = @Schema(implementation = NoteVersionResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/versions")
    public ResponseEntity<Page<NoteVersionResponse>> getNoteVersions(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "versionNumber", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(noteService.getNoteVersions(id, user, pageable));
    }

    @Operation(
            summary = "Restore note version",
            description = "Restores a note to a previous snapshot. Current state is saved as a snapshot before restore."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Version restored successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Version does not belong to this note",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note or version not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/versions/{versionId}/restore")
    public ResponseEntity<NoteResponse> restoreNoteVersion(
            @PathVariable UUID id,
            @PathVariable UUID versionId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.restoreNoteVersion(id, versionId, user));
    }

    @Operation(
            summary = "Move note",
            description = "Moves a note to a different group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note moved successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Target group is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note or group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/move")
    public ResponseEntity<NoteResponse> moveNote(
            @PathVariable UUID id,
            @Valid @RequestBody MoveNoteRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.moveNote(id, req, user));
    }

    @Operation(
            summary = "Duplicate note",
            description = "Creates a copy of a note in the same group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Note duplicated successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<NoteResponse> duplicateNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.duplicateNote(id, user));
    }

    @Operation(
            summary = "Copy note to folder",
            description = "Copies a note to a different group. Original note is kept."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Note copied successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Target group is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note or group not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/copy")
    public ResponseEntity<NoteResponse> copyNote(
            @PathVariable UUID id,
            @Valid @RequestBody CopyNoteRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.copyNote(id, req, user));
    }

    @Operation(
            summary = "Archive note",
            description = "Archives a note. Archived notes are excluded from normal listings."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note archived successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/archive")
    public ResponseEntity<NoteResponse> archiveNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.archiveNote(id, user));
    }

    @Operation(
            summary = "Unarchive note",
            description = "Restores an archived note to active status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note unarchived successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/unarchive")
    public ResponseEntity<NoteResponse> unarchiveNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.unarchiveNote(id, user));
    }

    @Operation(
            summary = "Delete note (soft delete)",
            description = "Soft-deletes a note. Moves to bin for 30-day restore window."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Note soft-deleted"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        noteService.softDeleteNote(id, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Create public link for note",
            description = "Generates a public shareable link for the note. Cannot be done on locked notes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Public link created",
                    content = @Content(schema = @Schema(implementation = ShareLinkResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Note is locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/public-link")
    public ResponseEntity<ShareLinkResponse> createPublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.createNotePublicLink(id, user));
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
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/public-link/regenerate")
    public ResponseEntity<ShareLinkResponse> regeneratePublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.regenerateNotePublicLink(id, user));
    }

    @Operation(
            summary = "Revoke public link",
            description = "Removes the public link, making the note private again."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Public link revoked"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}/public-link")
    public ResponseEntity<Void> revokePublicLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        noteService.revokeNotePublicLink(id, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Toggle note favorite",
            description = "Toggles the favorite status of a note."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Favorite toggled successfully",
                    content = @Content(schema = @Schema(implementation = NoteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Note not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/favorite")
    public ResponseEntity<NoteResponse> toggleFavorite(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.toggleFavorite(id, user));
    }
}

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/notes/public")
@Tag(name = "Public Notes", description = "Public note access endpoints (no auth required)")
@RequiredArgsConstructor
class PublicNoteController {

    private final NoteService noteService;

    @Operation(
            summary = "Get public note by share token",
            description = "Read-only access to a publicly shared note via share token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PublicNoteResponse.class))),
            @ApiResponse(responseCode = "404", description = "Invalid share token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{token}")
    public ResponseEntity<PublicNoteResponse> getPublicNote(@PathVariable String token) {
        return ResponseEntity.ok(noteService.getPublicNoteByToken(token));
    }
}
