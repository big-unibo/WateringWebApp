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

    async getOrganizations() {
        try {
            const organizations = await this.Organization.findAll()
            return organizations;
        } catch (error) {
            throw new Error(`Error retrieving organizations caused by: ${error.message}`);
        }
    }

    async getOrganizationDetails(organizationId, userId, isAdmin) {
        try {
            const query = `
            SELECT o.id, o.organization_name AS "organizationName",
                json_agg(DISTINCT jsonb_build_object('id', c.id, 'companyName', c.company_name)) FILTER (WHERE c.id IS NOT NULL) AS companies
            FROM organizations o
                LEFT JOIN companies_organizations co ON co.organization_id = o.id
                LEFT JOIN companies c ON co.company_id = c.id
                LEFT JOIN (SELECT DISTINCT company_id FROM master_data_permits 
                    WHERE user_id = :userId) p ON 
                    p.company_id = c.id
            WHERE o.id = :organizationId AND (
                :isAdmin = true
                OR p.company_id = c.id
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