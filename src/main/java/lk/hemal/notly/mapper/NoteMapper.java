package lk.hemal.notly.mapper;

import lk.hemal.notly.dto.response.NoteResponse;
import lk.hemal.notly.dto.response.NoteSummaryResponse;
import lk.hemal.notly.entity.Note;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.WARN
)
public interface NoteMapper {

    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerDisplayName", source = "owner.displayName")
    @Mapping(target = "locked", source = "locked")
    @Mapping(target = "favorite", source = "favorite")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "visibility", source = "visibility")
    NoteResponse toResponse(Note note);

    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerDisplayName", source = "owner.displayName")
    @Mapping(target = "locked", source = "locked")
    @Mapping(target = "favorite", source = "favorite")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "visibility", source = "visibility")
    NoteSummaryResponse toSummaryResponse(Note note);
}
