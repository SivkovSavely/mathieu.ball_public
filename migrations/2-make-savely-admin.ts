import {IDb, saveDb, User} from "../db";
import {UserLevel} from "../ICommand";


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
    let savely = db.users.find(x => x.vkId === 150013768);
    if (savely === undefined) {
        const newSavelyUser = new User();
        newSavelyUser.vkId = 150013768;
        newSavelyUser.id = db.users.length;
        db.users.push(newSavelyUser);

        savely = newSavelyUser;
    }

    savely.level = UserLevel.botAdmin;
}