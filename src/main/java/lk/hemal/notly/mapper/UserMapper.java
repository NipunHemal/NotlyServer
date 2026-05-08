package lk.hemal.notly.mapper;

import lk.hemal.notly.dto.response.UserResponseDto;
import lk.hemal.notly.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.WARN
)
public interface UserMapper extends BaseMapper<User, UserResponseDto>{
}
