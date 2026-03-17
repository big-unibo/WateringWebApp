export const _deleteFromModelByParams = async (model, where) => {
    const rows = await model.findAll({
        where: where,
        attributes: ['id'],
        raw: true
    });
    const ids = rows.map(r => r.id);
    await model.destroy({
        where: where
    });
    return ids;
}