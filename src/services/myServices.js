const myServices = {
    // Create a new record in the provided model
    create: async (model, data) => {
      try {
        console.log('data is', data);
        const newRecord = await model.create(data);
        return { success: true, data: newRecord, message: `New ${model.name} created successfully!` };
      } catch (error) {
        return { success: false, message: `Error creating ${model.name}: ${error.message}` };
      }
    },
  
    // Read a record by ID from the provided model
    read: async (model, id, include = null, where = {}) => {
      try {
        const options = { where: { ...where, id } };  // Ensure the `id` is applied in the where clause
  
        // Conditionally include relationships if `include` is provided
        if (include) {
          options.include = include;
        }
  
        const record = await model.findOne(options);
        if (!record) {
          return { success: false, message: `${model.name} with id ${id} not found` };
        }
        return { success: true, data: record, message: `${model.name} with id ${id} retrieved successfully!` };
      } catch (error) {
        return { success: false, message: `Error retrieving ${model.name} with id ${id}: ${error.message}` };
      }
    },
  
    // Update a record by ID in the provided model
    update: async (model, id, data) => {
      try {
        const record = await model.findByPk(id);
        if (!record) {
          return { success: false, message: `${model.name} with id ${id} not found` };
        }
        const updatedRecord = await record.update(data);
        return { success: true, data: updatedRecord, message: `${model.name} with id ${id} updated successfully!` };
      } catch (error) {
        return { success: false, message: `Error updating ${model.name} with id ${id}: ${error.message}` };
      }
    },
  
    // Delete a record by ID from the provided model
    delete: async (model, id) => {
      try {
        const record = await model.findByPk(id);
        if (!record) {
          return { success: false, message: `${model.name} with id ${id} not found` };
        }
        await record.destroy();
        return { success: true, message: `${model.name} with id ${id} deleted successfully!` };
      } catch (error) {
        return { success: false, message: `Error deleting ${model.name} with id ${id}: ${error.message}` };
      }
    },
  
    // List all records from the provided model
    list: async (model, include = null, where = {}, limit = 10, offset = 0) => {
      try {
        const options = { where, limit, offset };
  
        // Conditionally include relationships if `include` is provided
        if (include) {
          options.include = include;
        }
  
        const records = await model.findAll(options);
        return { success: true, data: records, message: `All ${model.name}s retrieved successfully!` };
      } catch (error) {
        return { success: false, message: `Error retrieving ${model.name}s: ${error.message}` };
      }
    },
  
    // Paginated list of records from the provided model
    listPagination: async (model, include = null, page = 1, limit = 10, where = {}) => {
      try {
        const options = { where, limit, offset: (page - 1) * limit };
  
        // Conditionally include relationships if `include` is provided
        if (include) {
          options.include = include;
        }
  
        const { rows, count } = await model.findAndCountAll(options);
        return {
          success: true,
          data: rows,
          totalPages: Math.ceil(count / limit),
          count,
          message: `All ${model.name}s retrieved successfully with pagination!`,
        };
      } catch (error) {
        return { success: false, message: `Error fetching paginated ${model.name}s: ${error.message}` };
      }
    },

    // find one record
    checkExist: async (model, where = {}) => {
      try {
        // Prepare options for the query
        const options = { where };
    
        // Fetch a single record from the database
        const record = await model.findOne(options);
    
        if (!record) {
          return { success: false, message: `No ${model.name} record found matching the criteria.` };
        }
    
        return {
          success: true,
          data: record,  // Ensure we send the record back in the response
          message: `${model.name} record retrieved successfully!`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error retrieving ${model.name} record: ${error.message}`,
        };
      }
    },
    

    checkAllExist: async (model, where = {}) => {
      try {
        // Prepare options for the query
        const options = { where };
  
        // Fetch a single record from the database
        const record = await model.findAll(options);
  
        if (!record) {
          return { success: false, message: `No ${model.name} record found matching the criteria.` };
        }
  
        return {
          success: true,
          data: record,
          message: `${model.name} record retrieved successfully!`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error retrieving ${model.name} record: ${error.message}`,
        };
      }
    },

    updateByWhere: async (model, where, data) => {
      try {
        // Find the record by `where` condition
        const record = await model.findOne({ where });
        if (!record) {
          return { success: false, message: `${model.name} not found with the provided criteria` };
        }
        
        // Update the record with new data
        const updatedRecord = await record.update(data);
        
        return { 
          success: true, 
          data: updatedRecord, 
          message: `${model.name} updated successfully!`
        };
      } catch (error) {
        return { 
          success: false, 
          message: `Error updating ${model.name}: ${error.message}` 
        };
      }
    },    

};

module.exports = myServices;
  
 