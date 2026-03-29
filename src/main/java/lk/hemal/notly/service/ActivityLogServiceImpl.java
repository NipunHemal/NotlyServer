package lk.hemal.notly.service;

import lk.hemal.notly.repo.ActivityLogRepo;

public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepo activityLogRepo;

    public ActivityLogServiceImpl(ActivityLogRepo activityLogRepo) {
        this.activityLogRepo = activityLogRepo;
    }
}
