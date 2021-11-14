/// <reference types="@sveltejs/kit" />
import { build, files, timestamp } from '$service-worker';

build.forEach((f: string) => console.log(f));
files.forEach((f: string) => console.log(f));
console.log(timestamp);

