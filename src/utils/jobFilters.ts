import type {Job, Patient} from '../services/api';
import type {JobFilterChip} from '../components/provider/JobsSearchFilter';

export function jobMatchesSearch(job: Job, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    job.patientName,
    job.serviceType,
    job.description,
    job.location,
    job.dateTime,
    job.id,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function jobMatchesChip(
  job: Job,
  chip: JobFilterChip,
  patients: Patient[],
): boolean {
  if (chip === 'all') return true;

  if (chip === 'active') {
    return (
      (job.status === 'new' ||
        job.status === 'accepted' ||
        job.status === 'ongoing') &&
      job.executionStatus !== 'completed'
    );
  }

  if (chip === 'managed') {
    return job.status === 'accepted' || job.status === 'ongoing';
  }

  if (chip === 'critical') {
    const patient = patients.find(p => p.id === job.patientId);
    return patient?.liveStatus === 'critical';
  }

  return true;
}
