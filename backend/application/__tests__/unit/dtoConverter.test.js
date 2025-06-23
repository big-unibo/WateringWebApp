const DtoConverter = require('../../services/DtoConverter');
const dtoConverter = new DtoConverter();

test('Dto converter tests', () => {
    const wrappers = [
        {
            refStructureName: "ZESPRI",
            companyName: "AZ. AGR. DALLE FABBRICHE ANDREA",
            fieldName: "Fondo Errano_T1 Basso_2023",
            sectorName: 1,
            plantRow: "T1 basso",
            value: 1.7344713152171296,
            timestamp: 1696809600,
            detectedValueTypeDescription: "Media Pot. Idr. Giornaliera"
        },
        {
            refStructureName: "ZESPRI",
            companyName: "AZ. AGR. DALLE FABBRICHE ANDREA",
            fieldName: "Fondo Errano_T1 Basso_2023",
            sectorName: 1,
            plantRow: "T1 basso",
            value: 1.422412,
            timestamp: 1696723200,
            detectedValueTypeDescription: "Media Pot. Idr. Ottimale"
        }];

    const result = dtoConverter.convertDeltaWrapper(wrappers);

    expect(result.values.length).toBe(1);
    expect(result.values[0].measures.length).toBe(2);
});