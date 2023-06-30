const express = require("express");
const app = express();
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const { open } = sqlite;
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Returns a list of all states in the state table
//API 1

const convertStateDbObjectAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const stateListQuery = `
    select * from state order by state_id;
    `;
  const getResponse = await db.all(stateListQuery);
  response.send(
    getResponse.map((eachState) => convertStateDbObjectAPI1(eachState))
  );
});

//Returns a state based on the state ID
//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `
    select * from state where state_id=${stateId};
    `;
  const getResponse = await db.get(stateIdQuery);
  response.send(convertStateDbObjectAPI1(getResponse));
});

//Create a district in the district table
//API 3

app.post("/districts/", async (request, response) => {
  const requestBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const postQuery = `
  insert into district (district_name,state_id,cases,cured,active,deaths)
  values(
      '${districtName}',${stateId},${cases},${cured},${active},${deaths}
  );
  `;
  const updateQuery = await db.run(postQuery);
  response.send("District Successfully Added");
  //const districtId = updateQuery.lastID;
  //response.send({ districtId: districtId });
});

//Returns a district based on the district ID
//API 4

const convertDbObjectAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    select * from district where district_id=${districtId};
    `;
  const getResponse = await db.get(districtQuery);
  response.send(convertDbObjectAPI4(getResponse));
});

//Deletes a district from the district table based on the district ID
//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    delete  from district where district_id=${districtId};
    `;
  const getResponse = await db.run(deleteQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const districtId = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtId;
  const updateQuery = `
    update district 
    set district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths};
    `;
  const getResponse = await db.run(updateQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
    select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) 
    as totalActive,
    sum(deaths) as totalDeaths from district where state_id=${stateId};
    `;
  const getResponse = await db.get(statsQuery);
  response.send(getResponse);
});

//Returns an object containing the state name of a district based on the district ID
//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const requestQuery = `
  select state_id from district where district_id=${districtId};
  `;
  const getStateId = await db.get(requestQuery);
  //console.log(getStateId.state_id);
  const stateQuery = `
  select state_name as stateName from state where state_id=${getStateId.state_id};
  `;
  const respondTo = await db.get(stateQuery);
  response.send(respondTo);
});

module.exports = app;
