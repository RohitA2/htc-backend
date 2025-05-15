const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const lifeStyle = sequelize.define("lifeStyle", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId:{
    type: DataTypes.INTEGER,
    allowNull:true
  },
  title:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  occupation:{
    type: DataTypes.STRING(255),
    allowNull:true
  },
  personality_traits:{
    type:DataTypes.STRING,
    allowNull:true
  },
  preferred_age:{
    type:DataTypes.STRING,
    allowNull:true
  },
  preferred_height:{
    type:DataTypes.FLOAT,
    allowNull:true
  },
  body_type:{
    type:DataTypes.STRING,
    allowNull:true
  },
  location:{
    type:DataTypes.STRING,
    allowNull:true
  },
  education:{
    type:DataTypes.STRING,
    allowNull:true
  },
  income_source:{
    type:DataTypes.STRING,
    allowNull:true
  },
  industry:{
    type:DataTypes.STRING,
    allowNull:true
  },
  religious_believe:{
    type:DataTypes.STRING,
    allowNull:true
  },
  cultural_background:{
    type:DataTypes.STRING,
    allowNull:true
  },
  languages_spoken:{
    type:DataTypes.STRING,
    allowNull:true
  },
  love_languages:{
    type:DataTypes.STRING,
    allowNull:true
  },
  pet_preference:{
    type:DataTypes.STRING,
    allowNull:true
  },
  relationship_experience:{
    type:DataTypes.STRING,
    allowNull:true
  },
  children:{
    type:DataTypes.STRING,
    allowNull:true
  },
  astrological_sign:{
    type:DataTypes.STRING,
    allowNull:true
  },
  

},{
  tableName:"lifeStyle",
  timestamps: true
});

module.exports = lifeStyle;
