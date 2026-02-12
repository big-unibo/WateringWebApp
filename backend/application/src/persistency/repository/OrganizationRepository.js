import { Op } from "sequelize";

class OrganizationRepository {
    constructor(models, sequelize) {
        this.Organization = models.Organization;
        this.CompaniesOrganizations = models.CompaniesOrganizations
        this.Company = models.Company;
        this.sequelize = sequelize;
    }

    async createOrganization(organizationName) {
        try {
            const organizationCreated = await this.Organization.create({
                organizationName
            });
            return organizationCreated;
        } catch (error) {
            throw new Error(`Error creating new organization caused by: ${error.message}`);
        }
    }

    async getOrganizations(filteringIds) {
        try {
            const where = {};

            if (Array.isArray(filteringIds)) {
                if (filteringIds.length > 0) {
                    where.id = {
                        [Op.in]: filteringIds
                    }
                } else {
                    return []
                }
            }
            const organizations = await this.Organization.findAll({ where })
            return organizations;
        } catch (error) {
            throw new Error(`Error retrieving organizations caused by: ${error.message}`);
        }
    }

    async getOrganizationDetails(organizationId, userId, isAdmin) {
        try {
            const query = `
            SELECT o.id, o.organization_name AS "organizationName",
                json_agg(DISTINCT jsonb_build_object('id', c.id, 'companyName', c.company_name)) AS companies
            FROM companies c
                JOIN companies_organizations co ON co.company_id = c.id
                JOIN organizations o ON o.id = co.organization_id
                LEFT JOIN (SELECT DISTINCT company_id, organization_id FROM master_data_permits 
                    WHERE user_id = :userId) p ON 
                    p.company_id = c.id
                    AND p.organization_id = o.id
            WHERE o.id = :organizationId AND (
                :isAdmin = true
                OR p.organization_id IS NOT NULL
            )
            GROUP BY o.id, o.organization_name`

            const results = await this.sequelize.query(query, {
                replacements: { userId, organizationId, isAdmin},
                type: this.sequelize.QueryTypes.SELECT
            });
            return results?.[0];
        } catch (error) {
            throw new Error(`Error retrieving organization details caused by: ${error.message}`);
        }
    }
}


export default OrganizationRepository