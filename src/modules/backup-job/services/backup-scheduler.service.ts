import { Injectable, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { BackuphistoryService } from "@module/backup-history/services/backup-history.service";
import { BackupJobEntity } from "src/modules/backup-job/entities/backup-job.entity";
import { BackupService } from "./backup.service";
import { CronJob } from "cron";
import { BackupjobSqlRepository } from "../repositories/backupjob-sql-repository";
import { InjectRepository } from "@module/repository/common/repository";
import { Entity } from "@module/repository";

@Injectable()
export class BackupSchedulerService implements OnModuleInit {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,

        @InjectRepository(Entity.BACKUP_JOB)
        private readonly backupjobRepo: BackupjobSqlRepository,

        private readonly backuphistoryService: BackuphistoryService,

        private readonly backupService: BackupService,
    ) {}
    async onModuleInit() {
        await this.intialize();
    }

    async intialize() {
        console.log("BackUp Scheduler");
        const jobs = await this.backupjobRepo.getMany({});
        console.log("Jobs Length: ", jobs.length);
        if (!jobs.length) {
            console.log("No backup jobs found in DB");
        }

        for (const job of jobs) {
            if (job.isActive) {
                await this.addCronjob(job);
            }
        }
    }

    async addCronjob(job: BackupJobEntity) {
        const jobname = this.getJobName(job._id);
        if (this.schedulerRegistry.doesExist("cron", jobname)) {
            return;
        }
        const cronJob = new CronJob(job.cronExpression, async () => {
            await this.executeJob(job._id);
        });
        console.log(`Create Backup Job: `, job._id);
        this.schedulerRegistry.addCronJob(jobname, cronJob);
        cronJob.start();
        console.log(`Backup Job ${job._id} is running`);
    }

    async updateCronjob(job: BackupJobEntity) {
        await this.deleteCron(job._id);
        if (job.isActive) {
            await this.addCronjob(job);
        }
    }
    private getJobName(jobId: string) {
        return `backup-job-${jobId}`;
    }

    private async executeJob(jobId: string) {
        try {
            const job = await this.backupjobRepo.getById(jobId);
            if (!job) {
                console.error(`Backup-job ${jobId} not found `);
                return;
            }
            const result = await this.backupService.backupDb(
                job.databaseConfig,
            );
            await this.backuphistoryService.createHistory(jobId, result);
        } catch (error) {
            console.error(`[BACKUP JOB ${jobId} FAILED]`, error);
        }
    }

    async deleteCron(jobId: string) {
        const jobName = this.getJobName(jobId);
        if (this.schedulerRegistry.doesExist("cron", jobName)) {
            this.schedulerRegistry.deleteCronJob(jobName);
            console.log(`Deleted Cron Job: ${jobName}`);
        }
    }
}
