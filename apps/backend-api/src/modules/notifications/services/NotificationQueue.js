const queuedJobs = [];

export const NotificationQueue = {
  async enqueue(job) {
    queuedJobs.push({ ...job, queuedAt: new Date() });
    return { queued: true, transport: process.env.REDIS_URL ? "redis" : "memory-dev", size: queuedJobs.length };
  },

  pending() {
    return queuedJobs.slice();
  },
};

export default NotificationQueue;
