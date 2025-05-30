const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function bookStore() {

  try {
    await client.connect();
    const db = client.db("plp_bookstore");
    const collection = db.collection("books");

    const fictionBooks = await collection.find({ genre: "Fiction" }).toArray();
    console.log("Fiction Books:", fictionBooks);

    const recentBooks = await collection.find({ published_year: { $gt: 2017 } }).toArray();
    console.log("Books after 2015:", recentBooks);

    const authorBooks = await collection.find({ author: "Paulo Coelho" }).toArray();
    console.log("Books by Paulo Coelho:", authorBooks);

    const updateResult = await collection.updateOne(
      { title: "Dune" },
      { $set: { price: 19.99 } }
    );

    console.log("Updated Dune price:", updateResult.modifiedCount);

    const deleteResult = await collection.deleteOne({ title: "1984" });
    console.log("Deleted 1984:", deleteResult.deletedCount);

   
    const filteredBooks = await collection.find(
      { in_stock: true, published_year: { $gt: 2010 } },
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }

    ).toArray();
    console.log("Books in stock and after 2010:", filteredBooks);

    //  Sort books by price (ascending)
    const sortedAsc = await collection.find({})
      .sort({ price: 1 })
      .toArray();
    console.log("Books sorted by price (asc):", sortedAsc);

    //  Sort books by price (descending)
    const sortedDesc = await collection.find({})
      .sort({ price: -1 })
      .toArray();
    console.log("Books sorted by price (desc):", sortedDesc);

    // Pagination 
    const page = 1;
    const limit = 5;
    const paginatedBooks = await collection.find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    console.log(`Books on page ${page}:`, paginatedBooks);

//Aggregation and pipeline

const avgPriceByGenre = await collection.aggregate([
      { $group: { _id: "$genre", averagePrice: { $avg: "$price" } } }
    ]).toArray();
    console.log(" Average Price by Genre:\n", avgPriceByGenre);

    // Author with the most books
    const topAuthor = await collection.aggregate([
      { $group: { _id: "$author", bookCount: { $sum: 1 } } },
      { $sort: { bookCount: -1 } },
      { $limit: 1 }
    ]).toArray();
    console.log("Author with Most Books:\n", topAuthor);

    // Group books by publication decade
    const booksByDecade = await collection.aggregate([
      {
        $project: {
          decade: {
            $concat: [
              { $toString: { $multiply: [ { $floor: { $divide: ["$published_year", 10] } }, 10 ] } },
              "s"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$decade",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    console.log(" Books Grouped by Decade:\n", booksByDecade);


    // indexing on tittle

    await collection.createIndex({ title: 1 });
    console.log("Index created on title field.");
    
    //Indexing on author and published year
    
    await collection.createIndex({ author: 1, published_year: -1 });
    console.log("Compound index created on author and published_year.");
    

    //Explain methods for index performance
    
    const explainResult = await collection.find({ title: "Dune" }).explain("executionStats");
    console.log(" Explain output for title search:\n", JSON.stringify(explainResult.executionStats, null, 2));


    

  } catch (error) {
    console.error(" Error running book store:", error);
  } finally {
    await client.close();
  }
}

bookStore();
