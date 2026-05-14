package lk.hemal.notly.service;

import lk.hemal.notly.dto.response.BinItemResponse;
import lk.hemal.notly.dto.response.RestoreResultResponse;
import lk.hemal.notly.entity.User;

import java.util.List;
import java.util.UUID;

public interface BinService {

    List<BinItemResponse> getBinItems(User user);

    RestoreResultResponse restoreBinItem(UUID binItemId, User user);

    void permanentDeleteBinItem(UUID binItemId, User user);

    void emptyBin(User user);
}
