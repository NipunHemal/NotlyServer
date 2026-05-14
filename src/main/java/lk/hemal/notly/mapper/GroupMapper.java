package lk.hemal.notly.mapper;

import lk.hemal.notly.dto.response.GroupResponse;
import lk.hemal.notly.entity.Group;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.WARN
)
public interface GroupMapper {

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "workspaceId", source = "workspace.id")
    @Mapping(target = "locked", source = "locked")
    @Mapping(target = "secure", source = "secure")
    @Mapping(target = "favorite", source = "favorite")
    @Mapping(target = "archived", source = "archived")
    @Mapping(target = "visibility", source = "visibility")
    GroupResponse toResponse(Group group);
}
