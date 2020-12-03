import { BugDiff } from "./BugDiff";
import { BugProps } from "./BugProps";

export interface UpdateResult {
    bug: BugProps;
    conflict: BugDiff;
}