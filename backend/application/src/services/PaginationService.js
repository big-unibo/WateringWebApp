class PaginationService {

    computePaginationMetadata(totalItems, page, itemsPerPage) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            page: page,
            pageSize: itemsPerPage,
            totalPages: totalPages,
            totalItems: totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }

}

export default PaginationService