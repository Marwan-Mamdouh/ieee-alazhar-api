const getBoardData = async () => {
    const queryText = `
        SELECT id, name, position, image_url AS image, bio, linkedin_url AS linkedin, board_type
        FROM members
        WHERE board_type IN ('officers', 'technical', 'branding', 'operation')
        ORDER BY id;
    `;

    try {
        const { rows } = await query(queryText);
        
        const structuredData = {
            officers: rows.filter(member => member.board_type === 'officers'),
            technical: rows.filter(member => member.board_type === 'technical'),
            branding: rows.filter(member => member.board_type === 'branding'),
            operation: rows.filter(member => member.board_type === 'operation'),
        };

        Object.keys(structuredData).forEach(key => {
            structuredData[key] = structuredData[key].map(({ board_type, ...rest }) => rest);
        });

        return structuredData;
    } catch (err) {
        console.error("Database query error in getBoardData:", err);
        throw new Error("Failed to retrieve board data.");
    }
};

const getLastChairman = async () => {
    const queryText = `
        SELECT id, name, position, image_url AS image, bio, linkedin_url AS linkedin
        FROM members
        WHERE board_type = 'last-chair'
        ORDER BY id DESC;
    `;

    try {
        const { rows } = await query(queryText);
        return rows; 
    } catch (err) {
        console.error("Database query error in getLastChairman:", err);
        throw new Error("Failed to retrieve all last chairmen data.");
    }
};

export default {
    getBoardData,
    getLastChairman,
};