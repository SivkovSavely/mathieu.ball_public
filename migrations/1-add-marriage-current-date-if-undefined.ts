import {IDb} from "../db";

/**
 * if false, only migrates once per db. if true, always migrates, so make sure it is idempotent.
 */
export function runAlways() {
    return true;
}

/**
 * actual function to migrate the database.
 * @param db
 */
export function migrate(db: IDb) {
    for (const gc of db.groupChats) {
        if (!gc.marriages) gc.marriages = [];
        for (const m of gc.marriages) {
            if (m.startDate === undefined) {
                m.startDate = Date.now();
            }
        }
    }
}