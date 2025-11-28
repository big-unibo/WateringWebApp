class PaginationService {

    computePaginationMetadata(totalItems, pageNumber, itemsPerPage) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            page: pageNumber,
            pageSize: itemsPerPage,
            totalPages: totalPages,
            totalItems: totalItems,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1
        };
    }

}

export default PaginationService