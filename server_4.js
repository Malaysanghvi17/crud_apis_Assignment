const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 7000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection pool to the MySQL database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'infoware_assignment',
});

// Connect to the MySQL database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ', err.stack);
        return;
    }

    console.log('Connected to the database.');
});

app.post('/employees_3', (req, res) => {
    const {
        emp_name,
        job_title,
        ph_number,
        email,
        address,
        city,
        state,
        contact_details,
    } = req.body;

    const sql = `INSERT INTO employees_3 (emp_name, job_title, ph_number, email, address, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    connection.query(
        sql,
        [emp_name, job_title, ph_number, email, address, city, state],
        (err, result) => {
            if (err) {
                console.error('Error inserting data into employees_3 table:', err.stack);
                return res.status(500).send('Error inserting data into employees_3 table');
            }

            const employeeId = result.insertId;

            if (contact_details && contact_details.length > 0) {
                const contactValues = contact_details.map((contact) => [
                    employeeId,
                    contact.contact_name,
                    contact.contact_ph_number,
                    contact.relationship,
                ]);

                const contactSql = `INSERT INTO contact_details (employee_id, contact_name, contact_ph_number, relationship) VALUES ?`;
                connection.query(contactSql, [contactValues], (err, contactResult) => {
                    if (err) {
                        console.error('Error inserting data into contact_details table:', err.stack);
                        return res.status(500).send('Error inserting data into contact_details table');
                    }

                    console.log('Data inserted successfully into employees_3 and contact_details tables.');
                    return res.send('Employee created successfully!');
                });
            } else {
                console.log('Data inserted successfully into employees_3 table.');
                return res.send('Employee created successfully!');
            }
        }
    );
});

// List Employees_3 with contact details
app.get('/employees_3', (req, res) => {
    const page = req.query.page || 1; // Get the page parameter from the query string
    const limit = req.query.limit || 10; // Get the limit parameter from the query string

    const offset = (page - 1) * limit; // Calculate the offset based on the page and limit

    const sql = `SELECT employees_3.emp_id, employees_3.emp_name, employees_3.job_title, employees_3.ph_number, employees_3.email, employees_3.address, employees_3.city, employees_3.state, contact_details.contact_id, contact_details.contact_name, contact_details.contact_ph_number, contact_details.relationship FROM employees_3 LEFT JOIN contact_details ON employees_3.emp_id = contact_details.employee_id LIMIT ? OFFSET ?`;
    connection.query(sql, [limit, offset], (err, results) => {
        if (err) {
            console.error('Error retrieving employees_3 and contact details:', err.stack);
            return res.status(500).send('Error retrieving employees_3 and contact details');
        }

        // Process the results and return them to the client
        const employees_3 = results.reduce((acc, row) => {
            const employee = acc.find((e) => e.emp_id === row.emp_id);
            if (employee) {
                // Add contact details to the existing employee
                if (row.contact_id) {
                    employee.contact_details.push({
                        contact_id: row.contact_id,
                        contact_name: row.contact_name,
                        contact_ph_number: row.contact_ph_number,
                        relationship: row.relationship,
                    });
                }
            } else {
                // Create a new employee and add contact details
                const newEmployee = {
                    emp_id: row.emp_id,
                    emp_name: row.emp_name,
                    job_title: row.job_title,
                    ph_number: row.ph_number,
                    email: row.email,
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    contact_details: [],
                };

                if (row.contact_id) {
                    newEmployee.contact_details.push({
                        contact_id: row.contact_id,
                        contact_name: row.contact_name,
                        contact_ph_number: row.contact_ph_number,
                        relationship: row.relationship,
                    });
                }

                acc.push(newEmployee);
            }

            return acc;
        }, []);

        return res.json(employees_3);
    });
});
// Update Employee
app.put('/employees_3/update/:field/:value/:updateField/:updatedValue', (req, res) => {
    const { field, value, updateField, updatedValue } = req.params;
    const sql = `UPDATE employees_3 SET ${updateField} = ? WHERE ${field} = ?`;
    console.log(sql);

    connection.query(sql, [updatedValue, value], (err, result) => {
        if (err) {
            console.error('Error updating employee:', err.stack);
            return res.status(500).send('Error updating employee');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Employee not found');
        }

        console.log('Employee updated successfully');
        return res.send('Employee updated successfully!');
    });
});

// Delete Employee
app.delete('/employees_3/delete/:emp_id', (req, res) => {
    const emp_id = req.params.emp_id;

    const deleteEmployeeS_3ql = 'DELETE FROM employees_3 WHERE emp_id = ?';
    connection.query(deleteEmployeeS_3ql, [emp_id], (err, result) => {
        if (err) {
            console.error('Error deleting employee:', err.stack);
            return res.status(500).send('Error deleting employee');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Employee not found');
        }

        const deleteContactSql = 'DELETE FROM contact_details WHERE employee_id = ?';
        connection.query(deleteContactSql, [emp_id], (err, contactResult) => {
            if (err) {
                console.error('Error deleting employee contact details:', err.stack);
                return res.status(500).send('Error deleting employee contact details');
            }

            console.log('Employee and associated contact details deleted successfully');
            return res.send('Employee and associated contact details deleted successfully!');
        });
    });
});

// Get Employee
app.get('/employees_3/search/:emp_id', (req, res) => {
    const emp_id = req.params.emp_id;

    // const sql = `SELECT employees_3.emp_id, employees_3.emp_name, employees_3.job_title, employees_3.ph_number, employees_3.email, employees_3.address, employees_3.city, employees_3.state, contact_details.contact_id, contact_details.contact_name, contact_details.contact_ph_number, contact_details.relationship FROM employees_3 LEFT JOIN contact_details ON employees_3.emp_id = contact_details.employee_id WHERE employees_3.emp_id = ?`;
    const sql = `SELECT employees_3.emp_name, employees_3.emp_id FROM employees_3 LEFT JOIN contact_details ON employees_3.emp_id = contact_details.employee_id WHERE employees_3.emp_id = ?`;
    connection.query(sql, [emp_id], (err, results) => {
        if (err) {
            console.error('Error retrieving employee and contact details:', err.stack);
            return res.status(500).send('Error retrieving employee and contact details');
        }

        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        // Process the results and return it to the client side
        const employee = {
            emp_id: results[0].emp_id,
            emp_name: results[0].emp_name,
            job_title: results[0].job_title,
            ph_number: results[0].ph_number,
            email: results[0].email,
            address: results[0].address,
            city: results[0].city,
            state: results[0].state,
            contact_details: [],
        };

        results.forEach((row) => {
            if (row.contact_id) {
                employee.contact_details.push({
                    contact_id: row.contact_id,
                    contact_name: row.contact_name,
                    contact_ph_number: row.contact_ph_number,
                    relationship: row.relationship,
                });
            }
        });

        return res.json(employee);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
