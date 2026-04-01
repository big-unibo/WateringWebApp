import { Op } from "sequelize"
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js"

class CompanyRepository {
    constructor(models, sequelize) {
        this.Company = models.Company
        this.Organization = models.Organization
        this.CompaniesOrganizations = models.CompaniesOrganizations
        this.Farm = models.Farm
        this.sequelize = sequelize
    }

    async companyExists(companyId) {
        const count = await this.Company.count({
            where: { id: companyId }
        });
        return count > 0;
    }

    async createCompany(companyName, address, organizationIds = [], createdAt) {
        try {
            for(const organizationId of organizationIds){
                const organization = await this.Organization.findByPk(organizationId);
                if (!organization) {
                    throw new Error(`Organization with ID ${organizationId} does not exist.`);
                }
            }

            const companyCreated = await this.Company.create({
                companyName,
                address,
                createdAt
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
            SELECT c.id, c.company_name AS "companyName", c.address, c.created_at AS "createdAt", c.disabled_at AS "disabledAt",
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
            GROUP BY c.id, c.company_name, c.address, c.created_at, c.disabled_at`;

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
    async getCompanies(filteringIds, timeFilterFrom, timeFilterTo) {
        try {
            const where = {
                createdAt: {
                    [Op.lt]: timeFilterTo,
                },
                disabledAt: {
                    [Op.or]: {
                        [Op.gt]: timeFilterFrom,
                        [Op.is]: null
                    }
                }
            };

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

    async updateCompany(companyId, updates) {
        try {
            const company = await this.Company.findByPk(companyId);

            if (!company) throw new Error("Company not found");

            const {
                name,
                address,
                organizationIds,
            } = updates

            if (organizationIds) {
                for (const organizationId of organizationIds) {
                    const organization = await this.Organization.findByPk(organizationId);
                    if (!organization) {
                        throw new Error(`Organization with ID ${organizationId} does not exist.`);
                    }
                }
                await this.CompaniesOrganizations.destroy({
                    where: {
                        companyId: companyId
                    }
                })
                for (const organizationId of organizationIds) {
                    await this.CompaniesOrganizations.create({
                        companyId: companyId,
                        organizationId: organizationId
                    })
                }
            }

            return await company.update({companyName: name, address: address});
        } catch (error) {
            throw new Error(`Error while updating company caused by: ${error.message}`);
        }
    }

    async disableCompany(companyId, timestamp) {
        try {
            await this.Company.update(
                {
                    disabledAt: timestamp
                },
                {
                    where: {
                        id: companyId,
                        disabledAt: {
                            [Op.is]: null
                        },
                        createdAt: {
                            [Op.lt]: timestamp
                        }
                    }
                }
            )
        } catch (error) {
            throw new Error(`Error disabling company: ${error.message}`);
        }
    }

    async deleteCompany(companyId) {
        try {
            await _deleteFromModelByParams(this.CompaniesOrganizations, { companyId: companyId })
            await _deleteFromModelByParams(this.Company, { id: companyId })
        } catch (error) {
            throw new Error(`Error deleting company: ${error.message}`);
        }
    }
}

export default CompanyRepository