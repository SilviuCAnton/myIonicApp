import { BugProps } from "./BugProps";

export interface BugDiff {
    localVersion: BugProps;
    serverVersion: BugProps;
}