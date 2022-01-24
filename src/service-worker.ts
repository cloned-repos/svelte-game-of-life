import { build, files, timestamp } from '$service-worker';

build.forEach(f => console.log(f));
files.forEach(f => console.log(f));
console.log(timestamp);