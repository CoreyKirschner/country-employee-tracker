const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');
const connection = require('./config/connection.js');


// function to retrieve and display all departments
async function viewDepartments() {
  const query = "SELECT * FROM departments";
  const [rows, fields] = await connection.promise().query(query);
  console.table(rows, ['id', 'name']);
}

async function viewRoles() {
  const query = "SELECT roles.id, roles.title, departments.name AS department, roles.salary FROM roles LEFT JOIN departments ON roles.department_id = departments.id";
  const [rows, fields] = await connection.promise().query(query);
  console.table(rows);
}

async function addDepartment() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the department:'
    },
    {
      type: 'input',
      name: 'id',
      message: 'Enter the id of the department:'
    }
  ]);

  if (!answers.name) {
    console.error('Department name cannot be empty!');
    return;
  }

  if (!answers.id) {
    console.error('Department id cannot be empty!');
  }

  const query = `INSERT INTO departments (id, name) VALUES (?, ?)`;
  const values = [answers.id, answers.name];
  try {
    await connection.promise().query(query, values);
    console.log(`Department "${answers.name}" added successfully!`);
  } catch (error) {
    console.error(error);
  }
}

async function getDepartments() {
  const query = `SELECT * FROM departments`;
  const [rows, fields] = await connection.promise().query(query);
  return rows;
}

async function addRole() {
  const departments = await getDepartments();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Enter the id of the role'
    },
    {
      type: 'list',
      name: 'department',
      message: 'Select the department of the role:',
      choices: departments.map((department) => department.name),
    },
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title of the role:',
    },
    {
      type: 'number',
      name: 'salary',
      message: 'Enter the salary of the role:',
    }
  ]);

  const department = departments.find(
    (department) => department.name === answers.department
  );

  const query = `
    INSERT INTO roles (title, department, salary, id)
    VALUES (?, ?, ?, ?)
  `;

  const values = [answers.title,answers.department, answers.salary, answers.id];

  try {
    await connection.promise().query(query, values);
    console.log(`Role "${answers.title}" added successfully!`);
  } catch (error) {
    console.error(error);
  }
};

async function getRoles() {
  const query = "SELECT * FROM roles";
  const [rows, fields] = await connection.promise().query(query);
  return rows;
}

async function getEmployees() {
  const query = "SELECT * FROM employees";
  const [rows, fields] = await connection.promise().query(query);
  return rows;
}

async function viewEmployees() {
  const query = `
    SELECT
      employees.id, 
      employees.first_name, 
      employees.last_name, 
      roles.title, 
      roles.salary, 
      COALESCE(departments.name, 'No Department') AS department,
      COALESCE(CONCAT(managers.first_name, ' ', managers.last_name), 'No Manager') AS manager
    FROM employees
    INNER JOIN roles ON employees.role_id = roles.id
    LEFT JOIN departments ON roles.department_id = departments.id
    LEFT JOIN employees AS managers ON employees.manager_id = managers.id
  `;
  const [rows, fields] = await connection.promise().query(query);
  console.table(rows);
}


async function addEmployee() {
  const roles = await getRoles();
  const employees = await getEmployees();
  const departments = await getDepartments();

  const maxId = Math.max(...employees.map(employee => employee.id));
  const nextId = maxId + 1;

  const employeeQuestions = [
    {
      type: 'input',
      name: 'firstName',
      message: "Enter the employee's first name:"
    },
    {
      type: 'input',
      name: 'lastName',
      message: "Enter the employee's last name:"
    },
    {
      type: 'list',
      name: 'roleId',
      message: "Select the employee's role:",
      choices: roles.map(role => ({
        name: role.title,
        value: role.id
      }))
    }
  ];

  const answers = await inquirer.prompt(employeeQuestions);

  const query = `INSERT INTO employees (id, first_name, last_name, role_id) 
  VALUES (?, ?, ?, ?)
  `;
  const values = [nextId, answers.firstName, answers.lastName, answers.roleId];

  try {
    const [result, fields] = await connection.promise().query(query, values);
    console.log(`Employee ${answers.firstName} ${answers.lastName} added successfully!`);
  } catch (error) {
    console.error(error);
  }
};


async function updateEmployeeRole() {
  const employeesQuery = "SELECT * FROM employees";
  const [employees, employeeFields] = await connection.promise().query(employeesQuery);

  const employeeChoices = employees.map((employee) => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id,
  }));

  const rolesQuery = "SELECT * FROM roles";
  const [roles, roleFields] = await connection.promise().query(rolesQuery);

  const roleChoices = roles.map((role) => ({
    name: role.title,
    value: role.id,
  }));

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "employeeId",
      message: "Select an employee to update:",
      choices: employeeChoices,
    },
    {
      type: "list",
      name: "roleId",
      message: "Select a new role for the employee:",
      choices: roleChoices,
    },
  ]);

  const updateQuery = "UPDATE employees SET role_id = ? WHERE id = ?";
  const updateValues = [answers.roleId, answers.employeeId];

  try {
    await connection.promise().query(updateQuery, updateValues);
    console.log("Employee role updated successfully!");
  } catch (error) {
    console.error(error);
  }
}


const questions = [
  {
    type: "list",
    name: "option",
    message: "What would you like to do?",
    choices: [
      "View all departments",
      "View all roles",
      "View all employees",
      "Add a department",
      "Add a role",
      "Add an employee",
      "Update an employee role",
      "Quit"
    ]
  }
];

function startApp() {
  inquirer
    .prompt(questions)
    .then(answers => {
      switch (answers.option) {
        case "View all departments":
        viewDepartments().then(() => startApp());
          break;
        case "View all roles":
        viewRoles().then(() => startApp());
          break;
        case "View all employees":
        viewEmployees().then(() => startApp());
          break;
        case "Add a department":
        addDepartment().then(() => startApp());
          break;
        case "Add a role":
        addRole().then(() => startApp());
          break;
        case "Add an employee":
        addEmployee().then(() => startApp());
          break;
        case "Update an employee role":
        updateEmployeeRole().then(() => startApp());
          break;
        case "Quit":
          process.exit();
      }
    })
    .catch(err => {
      console.log(err);
    });
}

startApp();