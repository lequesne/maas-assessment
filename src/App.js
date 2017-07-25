import React, {Component} from 'react';
import {ApolloClient, createNetworkInterface, gql} from 'react-apollo';
import {Grid, Row, Col} from 'react-flexbox-grid';

class App extends Component {

    constructor(props) {
        super(props);

        //initial state
        this.state = {
            loaded: false,
            solved: false,
            totalObjects: null,
            maasObject: null,
            puzzleIsActive: false,
            showDetails: false
        }

        //bindings
        this.startNewPuzzle = this.startNewPuzzle.bind(this);
        this.fetchRandomObject = this.fetchRandomObject.bind(this);
        this.puzzleSolved = this.puzzleSolved.bind(this);
        this.solvePuzzle = this.solvePuzzle.bind(this);
        this.cleanUpPuzzle = this.cleanUpPuzzle.bind(this);

        //puzzle defaults
        puzzleGame.defaultMixed = true;
        puzzleGame.defaultSimple = true;
        puzzleGame.defaultLevel = 0;
        puzzleGame.defaultPolygon = true;
        puzzleGame.defaultMatchcolor = '#e30066';
        puzzleGame.defaultFalsecolor = '';
        puzzleGame.defaultAreacolor = '#e0e0e0';
        puzzleGame.defaultBgrndcolor = '#000000';
        puzzleGame.defaultBorderwide = 5;
        puzzleGame.defaultAreaopacity = 0;
        puzzleGame.defaultBorderopacity = 0.2;
        puzzleGame.defaultShadowopacity = 0.3;
        puzzleGame.defaultCallback = () => {
            this.puzzleSolved();
        }

    }

    //on init
    componentWillMount() {

        //get total number of objects in collection for randomization
        maasApiClient.query({query: gql `
            query objectTotal {
                objectTotal
            }
        `}).then(response => {

            this.setState({totalObjects: response.data.objectTotal});

            //start new game
            this.startNewPuzzle();

        }).catch(error => console.error(error));

    }

    //on new game
    startNewPuzzle() {

        //set loading state
        this.setState({loaded: false});

        //fetch a random object from the collection
        setTimeout(()=>{
            this.fetchRandomObject();
            document.body.scrollTop = 0;
        },500);

    }

    fetchRandomObject() {

        //random number of total objects to skip to
        let randomSkip = Math.floor(Math.random() * this.state.totalObjects - 1) + 0;

        //query a random object from the maas api using random skip number based off total
        maasApiClient.query({
            query: gql `query maasAssessment($randomSkip: Int) {
                objects(filter:{hasMedia: true}, limit:1, skip: $randomSkip) {
                    _id
                    displayTitle
                    description
                    mainImage {
                        url
                    }
                    dimensions {
                        height
                        width
                        depth
                    }
                }
            }`,
            variables: {
                randomSkip: randomSkip
            }
        }).then(response => {

            //check to make sure randomly queried image has title, summary and a main image
            if (response.data.objects[0] &&
                response.data.objects[0].displayTitle &&
                response.data.objects[0].description &&
                response.data.objects[0].mainImage &&
                response.data.objects[0].mainImage.url) {

                //set reset state
                this.setState({loaded: false, solved: false, maasObject: null, showDetails: false});

                //cleanup old canvas
                this.cleanUpPuzzle();

                //create new dom image for puzzle
                let puzzleImg = new Image();
                puzzleImg.id = 'puzzle-image';
                puzzleImg.src = response.data.objects[0].mainImage.url;
                document.getElementById('puzzle-container').appendChild(puzzleImg);

                //on dom image load init with puzzleGame
                puzzleImg.onload = () => {

                    //set object in state and apply positional class to puzzle game depending on image proportions
                    if (puzzleImg.width > puzzleImg.height) {
                        this.setState({loaded: true, maasObject: response.data.objects[0], tallPuzzleImage: false})
                    } else {
                        this.setState({loaded: true, maasObject: response.data.objects[0], tallPuzzleImage: true})
                    }

                    //init puzzle game with new object image
                    puzzleGame.add(puzzleImg);

                }

            } else {
                //no object was found or object did not include a main image
                //fetch another object
                this.fetchRandomObject();
            }

        }).catch(error => console.error(error));

    }

    cleanUpPuzzle() {
        //remove canvas and image puzzle elements
        let oldCanvas = document.getElementById('puzzle-image');
        if (oldCanvas) {
            oldCanvas.parentNode.removeChild(oldCanvas);
        }
        let oldBuffer = document.getElementById('puzzle-image_buffer');
        if (oldBuffer) {
            oldBuffer.parentNode.removeChild(oldBuffer);
        }
    }

    solvePuzzle() {
        puzzleGame.solve(document.getElementById('puzzle-image'));
        setTimeout(() => {
            this.puzzleSolved();
        }, 1000)
    }

    puzzleSolved() {
        this.setState({solved: true});

        this.cleanUpPuzzle();

        setTimeout(()=>{
            this.setState({showDetails: true});
        },1000);
    }

    render() {

        let puzzlePush = this.state.solved
            ? 0
            : 3;
        let puzzleWidth = this.state.solved
            ? 8
            : 6;

        return (
            <div className="App">

                <div id="loading-screen" className={this.state.loaded
                    ? 'loaded'
                    : null}>
                    <div className="spinner"></div>
                </div>

                <div className="container">

                    <h1>MAAS Object Discoverer</h1>

                    <p>
                        Put the pieces together and help uncover assorted objects from the MAAS collection.
                    </p>

                    <div className={`game-area ${this.state.solved ? 'solved' : ''}`}>

                        {this.state.showDetails ?
                        <div className="object-title">
                            {this.state.maasObject
                                ? <h2>{this.state.maasObject.displayTitle}</h2>
                                : null}
                        </div>
                        : null }

                        <Row className="object-row">

                            <Col xs={12} sm={6} smOffset={puzzlePush} className="puzzle-col">

                                <div id="puzzle-container" className={this.state.tallPuzzleImage
                                    ? 'tall-puzzle-image'
                                    : ''}>

                                    <img id="puzzle-solved" width="100%" src={this.state.maasObject
                                        ? this.state.maasObject.mainImage.url
                                        : null} alt="Puzzle"/>

                                </div>

                            </Col>

                            {this.state.showDetails
                                ? <Col xs={12} sm={6} className="object-details">

                                        <div className="object-description detail">
                                            <h3>Description</h3>
                                            {this.state.maasObject
                                                ? this.state.maasObject.description
                                                : null}
                                        </div>

                                        {this.state.maasObject && this.state.maasObject.dimensions.height || this.state.maasObject.dimensions.width || this.state.maasObject.dimensions.depth ?
                                        <div className="object-dimensions detail">
                                            <h3>Dimensions</h3>
                                            {this.state.maasObject && this.state.maasObject.dimensions.height ?
                                                <div><span className="spec">Height:</span> {this.state.maasObject.dimensions.height}mm</div>
                                            : null }
                                            {this.state.maasObject && this.state.maasObject.dimensions.width ?
                                                <div><span className="spec">Width:</span> {this.state.maasObject.dimensions.width}mm</div>
                                            : null }
                                            {this.state.maasObject && this.state.maasObject.dimensions.depth ?
                                                <div><span className="spec">Depth:</span> {this.state.maasObject.dimensions.depth}mm</div>
                                            : null }
                                        </div>
                                        : null }

                                        <div className="detail">
                                            <a className="button-link" href={`https://collection.maas.museum/object/${this.state.maasObject._id}`} target="_blank">View object on MAAS website</a>
                                        </div>

                                    </Col>
                                : null}

                        </Row>

                        <div className="controls">

                            {!this.state.solved
                                ? <button onClick={this.solvePuzzle}>Solve it for me</button>
                                : null}

                            <button onClick={this.startNewPuzzle}>Find another object!</button>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

}

//register an apollo client to connect with maas graphql api
const maasApiClient = new ApolloClient({
    networkInterface: createNetworkInterface({uri: 'https://api.maas.museum/graphql'})
});

//register puzzleGame
const puzzleGame = window.puzzleGame;

export default App;
