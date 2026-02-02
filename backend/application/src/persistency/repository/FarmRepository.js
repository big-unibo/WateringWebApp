class FarmRepository {

    constructor(models, sequelize) {
        this.Company = models.Company
        this.Farm = models.Farm
        this.Sector = models.Sector
        this.sequelize = sequelize
    }

    async farmExists(farmId) {
        const count = await this.Farm.count({
            where: { id: farmId }
        });
        return count > 0;
    }

    async getFarms(){
        try {
            const farms = await this.Farm.findAll()
            return farms;
        } catch (error) {
            throw new Error(`Error retrieving farms caused by: ${error.message}`);
        }
    }

    async createFarm(farmName, companyId, location) {
        try {
            const company = await this.Company.findByPk(companyId);
            if (!company) {
                throw new Error(`Company with ID ${companyId} does not exist.`);
            }

            const farmCreated = await this.Farm.create({
                farmName,
                companyId,
                location
            });

            return farmCreated;
        } catch (error) {
            throw new Error(`Error creating new farm caused by: ${error.message}`);
        }
    }

    async getFarmDetails(farmId) {
        try {
            const farm = await this.Farm.findByPk(farmId, {
                attributes: {
                    exclude: ['companyId']
                },
                include: [
                    {
                        model: this.Company,
                        as: 'company',
                        attributes: ['id', 'companyName'],
                    },
                    {
                        model: this.Sector,
                        as: 'sectors'
                    }
                ]
            });

            if (!farm) {
                throw new Error(`Farm with id ${farmId} not found`);
            }
            return farm.get({ plain: true });

        } catch (error) {
            throw new Error(`Error retrieving farm details: ${error.message}`);
        }
    }
}

export default FarmRepository