const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middle ware 
app.use(express.json());
app.use(cors());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4ayta.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db("VisaSphere");
        // user collection 
        const usersCollection = database.collection("users");
        // all visas collection 
        const allVisasCollection = database.collection("allVisas");
        // user applied applications for visas collection
        const appliedApplicationsVisasCollection = database.collection("appliedApplications");
        // visa type collection 
        const visaTypesCollection = database.collection("visaTypes");

        // users related All API
        // insert user API 
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user.email);
            const findOne = await usersCollection.findOne({ email: req.body.email });
            if (findOne) {
                return;
            }
            else {
                console.log(user);
                const result = await usersCollection.insertOne(user);
                res.json({
                    status: true,
                    result,
                    data: user
                })
            }
        })
        // Access all users API
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })
        // update last login time API 
        app.patch('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            console.log(user);
            const updatedLastLoginTime = {
                $set: {
                    lastSignInTime: user?.lastSignInTime
                }
            }
            const result = await usersCollection.updateOne(query, updatedLastLoginTime);
            res.json({
                status: true,
                data: user,
                result
            })
        })



        // All visas related all API
        // insert visa API 
        app.post('/visas', async (req, res) => {
            const visa = req.body;
            console.log(visa);
            const result = await allVisasCollection.insertOne(visa);
            res.json({
                status: true,
                result,
                data: visa
            })
        })
        // access all the visas API 
        app.get('/visas', async (req, res) => {
            const result = await allVisasCollection.find().toArray();
            res.json({
                status: true,
                result,
            })
        })
        // the latest visas API
        app.get('/latest-visas', async (req, res) => {
            const result = await allVisasCollection.find().limit(6).toArray();
            res.json({
                status: true,
                result,
            })
        })
        // single visa API 
        app.get('/visas/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allVisasCollection.findOne(query);

            res.json({
                status: true,
                data: result
            })
        })
        // get user added visas 
        app.get('/added-visas/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const filtered = await allVisasCollection.find(query).toArray();
            res.json({
                status: true,
                data: filtered
            })
        })
        // delete user added visas 
        app.delete('/added-visas/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const deletedData = await allVisasCollection.findOne(query);
            const result = await allVisasCollection.deleteOne(query);
            const userAppliedData = await appliedApplicationsVisasCollection.deleteOne({ visaId: id });
            res.json({
                status: true,
                result,
                deletedData: deletedData,
                userAppliedData
            })
        })
        // update user added visas 
        app.patch('/update-visa/:id', async (req, res) => {
            const body = req.body;
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            console.log(body);
            console.log(id);
            const updatedDoc = {
                $set: {
                    countryImage: body.countryImage,
                    countryName: body.countryName,
                    visaType: body.visaType,
                    processingTime: body.processingTime,
                    description: body.description,
                    ageRestriction: body.ageRestriction,
                    fee: body.fee,
                    validity: body.validity,
                    applicationMethod: body.applicationMethod
                }
            }
            const result = await allVisasCollection.updateOne(query, updatedDoc);
            res.json({
                status: true,
                result
            })
        })
        // get single visa API 
        app.get('/added-visa/:id', async (req, res) => {
            const id = req.params.id;
            const result = await allVisasCollection.findOne({ _id: new ObjectId(id) });
            res.json({
                status: true,
                data: result
            })
        })



        // user applied applications visas related all API
        // get all applied applications visas API 
        app.get('/applied-visas', async (req, res) => {
            const result = await appliedApplicationsVisasCollection.find().toArray();
            res.json({
                status: true,
                data: result
            })
        })
        // insert applied applications API 
        app.post('/applied-visas', async (req, res) => {
            const visa = req.body;
            console.log(visa);
            const query = { visaId: visa.visaId, applierEmail: visa.applierEmail };
            const findOne = await appliedApplicationsVisasCollection.findOne(query);
            if (findOne) {
                res.json({
                    message: "Already applied!"
                })
                return;
            }
            else {
                const result = await appliedApplicationsVisasCollection.insertOne(visa);
                res.json({
                    status: true,
                    result,
                    data: visa
                })
            }

        })
        // get specific user applied all applications via email, API 
        app.get('/applied-visas/:email', async (req, res) => {
            const email = req.params.email;
            const query = { applierEmail: email }
            const result = await appliedApplicationsVisasCollection.find(query).toArray();
            res.json({
                status: true,
                data: result
            })
        })
        // delete specific user applied application via visaId, userEmail API
        app.delete('/applied-visas/:id/:applierEmail', async (req, res) => {
            const visaId = req.params.id;
            const applierEmail = req.params.applierEmail;
            console.log(visaId, applierEmail);
            const query = { visaId: visaId, applierEmail: applierEmail };
            const deletedData = await appliedApplicationsVisasCollection.findOne(query);
            const result = await appliedApplicationsVisasCollection.deleteOne();
            res.json({
                status: true,
                result,
                deletedData: deletedData
            })
        })
        // search by country name API 
        app.get('/search-applied', async (req, res) => {
            const { search } = req.query;
            const result = await appliedApplicationsVisasCollection.find().toArray();
            res.json({
                status: true,
                data: result,
                search
            })
        })


        // visa types collection related API 
        // insert visa types API 
        app.post('/visa-types', async (req, res) => {
            const body = req.body;
            const result = await visaTypesCollection.insertOne(body);
            res.json({
                status: true,
                result,
                insertedData: body
            })
        })
        // get all visa types 
        app.get('/visa-types', async (req, res) => {
            const result = await visaTypesCollection.find().toArray();
            res.json(
                {
                    status: true,
                    data: result
                }
            )
        })



        // optional 
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.json({
        status: true,
        message: `Successfully Running on PORT ${port}`
    })
})

app.listen(port, () => {
    console.log("Server is Running on ", port);
})