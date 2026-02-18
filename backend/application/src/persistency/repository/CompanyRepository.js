import { Op } from "sequelize"

class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company
        this.Organization = models.Organization
        this.CompaniesOrganizations = models.CompaniesOrganizations
        this.Farm = models.Farm
        this.sequelize = sequelize
    }

    async createCompany(companyName, address, organizationIds = []) {
        try {
            for(const organizationId of organizationIds){
                const organization = await this.Organization.findByPk(organizationId);
                if (!organization) {
                    throw new Error(`Organization with ID ${organizationId} does not exist.`);
                }
            }

            const companyCreated = await this.Company.create({
                companyName,
                address
            });

            for(const organizationId of organizationIds){
                await this.CompaniesOrganizations.create({
                    companyId: companyCreated.id,
                    organizationId: organizationId
                })
            }

            return companyCreated;
        } catch (error) {
            throw new Error(`Error creating new company caused by: ${error.message}`);
        }
    }

    async getCompanyDetails(companyId, userId, isAdmin) {
        try {
            const query = `
            SELECT c.id, c.company_name AS "companyName", c.address,
                json_agg(DISTINCT jsonb_build_object('id', o.id, 'organizationName', o.organization_name)) FILTER (WHERE o.id IS NOT NULL) AS organizations, 
                json_agg(DISTINCT jsonb_build_object('id', f.id, 'farmName', f.farm_name)) FILTER (WHERE f.id IS NOT NULL) AS farms 
            FROM companies c
                LEFT JOIN farms f ON f.company_id = c.id
                LEFT JOIN companies_organizations co ON co.company_id = c.id
                LEFT JOIN organizations o ON o.id = co.organization_id
                LEFT JOIN (SELECT DISTINCT company_id, farm_id FROM master_data_permits 
                    WHERE user_id = :userId) p ON 
                    p.company_id = c.id
                    AND p.farm_id IS NOT DISTINCT FROM f.id
            WHERE c.id = :companyId AND (
                :isAdmin = true
                OR p.company_id IS NOT NULL
            )
            GROUP BY c.id, c.company_name, c.address`

            const results = await this.sequelize.query(query, {
                replacements: { userId, companyId, isAdmin},
                type: this.sequelize.QueryTypes.SELECT
            });
            return results?.[0];
        } catch (error) {
            throw new Error(`Error retrieving company details caused by: ${error.message}`);
        }
    }

    /**
     * Returns companies filtered by given ids, if filteringIds is not defined it returns all the companies, if it is empty return empty
     */
    async getCompanies(filteringIds) {
        try {
            const where = {};

            if (Array.isArray(filteringIds)) {
                if (filteringIds.length > 0){
                    where.id = {
                        [Op.in]: filteringIds
                    }
                } else {
                    return []
                }
            }

            const companies = await this.Company.findAll({ where });
            return companies;
        } catch (error) {
            throw new Error(`Error retrieving companies caused by: ${error.message}`);
        }
    }
}

export default CompanyRepository