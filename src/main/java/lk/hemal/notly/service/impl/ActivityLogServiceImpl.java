package lk.hemal.notly.service.impl;

import lk.hemal.notly.repo.ActivityLogRepo;
import lk.hemal.notly.service.ActivityLogService;

public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepo activityLogRepo;

    public ActivityLogServiceImpl(ActivityLogRepo activityLogRepo) {
        this.activityLogRepo = activityLogRepo;
    }
}
