const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");
// const date = require('./date');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const url = 'mongodb+srv://user_karlo:8086@cluster0.le7jtqf.mongodb.net/todolistDB'
// const url = 'mongodb://127.0.0.1:27017/todolistDB'

mongoose.set('strictQuery', true);
// mongoose.connect(url);

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(url);
  console.log("MongoDB connected Successfully")
}

const itemSchema = {
    name: {
        type: String,
        required: true
    }
};

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
    name: "Welcome to todoList!"
});

const item2 = new Item({
    name: "Hit the + button to add new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});
const defaultArray = [item1, item2, item3]

const listSchema = {
    name: String,
    items: [itemSchema]
}

const List = mongoose.model("list", listSchema);



function insertDefaultDocument() {

    Item.insertMany(defaultArray, function (err) {
        if (err) {
            console.log("Error is : " + err);
        } else {
            console.log("Document inserted");
        }
    });
}

// const itemToBeAdded = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function (req, res) {
    Item.find({}, function (err, item) {
        if (item.length === 0) {
            insertDefaultDocument();
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newItems: item });
        }
    });

});

app.post("/", function (req, res) {
    let newItemToBeAdded = req.body.newItem;
    let listName = req.body.list
    const item = new Item({
        name: newItemToBeAdded
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            console.log("FoundList : " + foundList);
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }



});
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    console.log(req.params)
    console.log(customListName)
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create new List
                console.log("Document can be inserterd");
                const list = new List({
                    name: customListName,
                    items: defaultArray
                })
                list.save()
                console.log("Document Inserted Successfully : " + list.name)
                res.redirect("/" + customListName)
            } else {
                console.log("Document is already present with name : " + customListName);
                res.render("list", { listTitle: foundList.name, newItems: foundList.items });
            }
        }
    });

});


app.post("/delete", function (req, res) {
    // let selectedItemID = 'ObjectId("' + req.body.checkedList + '")';
    let selectedItemID = req.body.checkedList ;
    let currentListName = req.body.listName;
    console.log(selectedItemID);
    // console.log(currentListName);
    console.log(currentListName)
    if (currentListName === "Today") {
        Item.findByIdAndRemove(selectedItemID, function (err, docs) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Removed Item : ", docs.name);
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: currentListName},
            { $pull: { "items": { "_id": selectedItemID } } }, function(err, foundList) {
                if(!err){
                    res.redirect("/"+currentListName);
                }
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(port, function () {
    console.log("---------Server is Up and running---------");
});
