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
// responding with admins or fans list
app.get("/users/list", async (req, res) => {
    try {
        const providedRole = req.query.role;
        const filter = { role: providedRole };
        const cursor = UsersCollection.find(filter);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// providing categories list
app.get("/categories/list", async (req, res) => {
    try {
        const filter = {};
        const result = await CategoriesCollection.find(filter).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// adding new movie
app.post("/movies/addmovie", async (req, res) => {
    try {
        const newMovie = req.body;
        const result = await MoviesCollection.insertOne(newMovie);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// deleting a movie 
app.delete("/movies/deletemovie", async (req, res) => {
    try {
        const deleteId = req.query.id;
        const filter = { _id: new ObjectId(deleteId) };
        const result = await MoviesCollection.deleteOne(filter);
        if (result.acknowledged) {
            await ReviewsCollection.deleteMany({ movieId: deleteId });
        }
        res.send(result);
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
// searching api
app.get("/movies/find", async (req, res) => {
    try {
        const searchText = req.query.q;
        const categoryText = req.query.category;
        const filter = {
            title: {
                $regex: searchText,
                $options: "i"
            },
            category: {
                $regex: categoryText,
                $options: "i"
            }
        };
        // if(!searchText && !categoryText){
        //     const result = await MoviesCollection.find({}).toArray();
        //     return res.send(result);
        // }
        const cursor = MoviesCollection.find(filter);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})
// top rated movies by sorting with highest stars
app.get("/movies/toprated", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit);
        const filter = {};
        const allMovies = await MoviesCollection.find(filter).sort({ stars: -1 }).toArray();
        const topMovies = allMovies.slice(0, limit);
        res.send(topMovies);
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
        if (result.acknowledged) {
            const id = review.movieId;
            const filter = { _id: new ObjectId(id) };
            const updatedDocument = {
                $inc: {
                    stars: parseInt(review.stars),
                    reviewer: 1
                }
            };
            const options = { upersert: true };

            await MoviesCollection.updateOne(filter, updatedDocument, options);
        }
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
// deleting specific review using it's id
// app.delete("/myreviews/:id", async (req, res) => {
//     try {
//         const id = req.params.id;
//         const filter = { _id: new ObjectId(id) };
//         const result = await ReviewsCollection.deleteOne(filter);
//         res.send(result);
//     } catch (error) {
//         console.log(error);
//     }
// })
// deleting an specific review qureying by _id authorized by admin
app.delete("/reviews/delete", async (req, res) => {
    try {
        const id = req.query.id;
        const filter = { _id: new ObjectId(id) };
        const review = await ReviewsCollection.findOne(filter);
        // deleting details at moviescollection
        const updatedDocument = {
            $inc: {
                stars: -parseInt(review.stars),
                reviewer: -1
            }
        }
        await MoviesCollection.updateOne({ _id: new ObjectId(review.movieId) }, updatedDocument);

        const result = await ReviewsCollection.deleteOne(filter);
        res.send(result);
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
        const updatedDocumentIfNotExist = {
            $push: {
                foundHelpful: email
            }
        };
        const updatedDocumentIfExist = {
            $pull: {
                foundHelpful: email
            }
        };
        // checking if already liked
        const exist = await ReviewsCollection.findOne(filter);
        if (exist.foundHelpful.includes(email)) {
            const result = await ReviewsCollection.updateOne(filter, updatedDocumentIfExist, options);
            return res.send({ result, message: "desliked" });
        }
        const result = await ReviewsCollection.updateOne(filter, updatedDocumentIfNotExist, options);
        res.send({ result, message: "liked" });
    } catch (error) {
        console.log(error);
    }
})


app.listen(port, () => {
    console.log(`server is running on ${port}`)
})