const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mogpxeu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function run() {
    try {
        client.connect();
        console.log(`mongoDB connected`);
    } catch (error) {
        console.log(error);
    }
}
run();

// collecttions
const UsersCollection = client.db('rateMovie').collection('users');
const MoviesCollection = client.db('rateMovie').collection('movies')
const CategoriesCollection = client.db('rateMovie').collection('categories');
const ReviewsCollection = client.db('rateMovie').collection('reviews');

app.get('/', (req, res) => {
    res.send("rateMovie server is running fine");
})

// users operations
app.post('/users', async (req, res) => {
    try {
        const newUser = req.body;
        const filter = { email: newUser.email };
        const exist = await UsersCollection.findOne(filter);
        if (exist) {
            return res.send({ status: 'false', message: "User already exists" });
        }
        const result = await UsersCollection.insertOne(newUser);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})

// checking if the user is admin or not
app.get('/users/isAdmin', async (req, res) => {
    try {
        const UserEmail = req.query.email;
        const filter = { email: UserEmail };
        const exist = await UsersCollection.findOne(filter);
        if (exist.role == "admin") {
            return res.send({ isAdmin: true });
        }
        else {
            return res.send({ isAdmin: false })
        }

    } catch (error) {
        console.log(error);
    }
})

// providing all the movies
app.get('/movies/all', async (req, res) => {
    try {
        const filter = {};
        const movies = await MoviesCollection.find(filter).toArray();
        res.send(movies);
    } catch (error) {
        console.log(error);
    }
})
// providing specific id movie
app.get('/movies/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const movie = await MoviesCollection.findOne(filter);
        res.send(movie);
    } catch (error) {
        console.log(error);
    }
})
// providing category specific movies
app.get('/movies', async (req, res) => {
    try {
        const category = req.query.category;
        const filter = {
            category: category
        };
        const result = await MoviesCollection.find(filter).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// providing one random movie for today's pick section
app.get('/movies/movie/random', async (req, res) => {
    try {
        const filter = {};
        const movies = await MoviesCollection.find(filter).toArray();
        let randomNumber = Math.floor(Math.random() * movies.length) + 1;
        res.send(movies[randomNumber]);
    } catch (error) {
        console.log(error);
    }
})

// posting comments 
app.post("/reviews", async (req, res) => {
    try {
        const review = req.body;
        const result = await ReviewsCollection.insertOne(review);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// getting all the reviews for specific user using email
app.get("/myreviews", async (req, res) => {
    try {
        const email = req.query.email;
        const filter = { userEmail: email };
        const cursor = ReviewsCollection.find(filter);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// deleting specific review using it's id
app.delete("/myreviews/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await ReviewsCollection.deleteOne(filter);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// proving reviews of specific movie reviews
app.get("/reviews/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { movieId: id };
        const cursor = ReviewsCollection.find(filter);
        const result = await cursor.toArray();
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})
// editing found help ful
app.patch("/reviews/foundHelpful", async (req, res) => {
    try {
        const id = req.query.id;
        const email = req.query.email;
        const filter = { _id: new ObjectId(id) };
        const options = { upersert: true }

        // checking if already liked
        const exist = await ReviewsCollection.findOne(filter);
        if(exist.foundHelpful.includes(email)){
            console.log("exist")
        }

        // const updatedDocument = {
        //     $push: {
        //         foundHelpful: email
        //     }
        // };
        // const result = await ReviewsCollection.updateOne(filter, updatedDocument, options);
        // res.send(result);
    } catch (error) {
        console.log(error);
    }
})


app.listen(port, () => {
    console.log(`server is running on ${port}`)
})