import { removeUndefined } from './utils.js'

export const _updateEntity = async (userId, data, repositoryFunction, userActionService, updateLogTable) => {
    try {
        const { id, ...fields } = data;

        const updatedEntityInstance = await repositoryFunction(
            id,
            removeUndefined(fields)
        )

        if (updatedEntityInstance) {
            const entityData = updatedEntityInstance.get({ plain: true });
            await userActionService.logUpdate(userId, updateLogTable, id, null, entityData)
        }
    } catch (error) {
        console.error(`Error updating entity: ${error.message}`);
        throw error;
    }
}