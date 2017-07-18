import React, {Component} from 'react';
import {ApolloClient, createNetworkInterface, gql} from 'react-apollo';
import {Grid, Row, Col} from 'react-flexbox-grid';
// import {Container, Row, Col, Button} from 'react-bootstrap';

class App extends Component {

    constructor(props) {

        super(props);

        //initial state
        this.state = {
            loaded: false,
            solved: false,
            totalObjects: null,
            maasObject: null,
            puzzleIsActive: false
        }

        //bindings
        this.startNewPuzzle = this.startNewPuzzle.bind(this);
        this.fetchRandomObject = this.fetchRandomObject.bind(this);
        this.puzzleSolved = this.puzzleSolved.bind(this);
        this.solvePuzzle = this.solvePuzzle.bind(this);
        this.cleanUpPuzzle = this.cleanUpPuzzle.bind(this);

        //puzzle defaults
        window.puzzlePieces.defaultMixed = true;
        window.puzzlePieces.defaultSimple = true;
        window.puzzlePieces.defaultLevel = 0;
        window.puzzlePieces.defaultPolygon = true;
        window.puzzlePieces.defaultMatchcolor = '#e30066';
        window.puzzlePieces.defaultFalsecolor = '';
        window.puzzlePieces.defaultAreacolor = '#e0e0e0';
        window.puzzlePieces.defaultBgrndcolor = '#000000';
        window.puzzlePieces.defaultBorderwide = 5;
        window.puzzlePieces.defaultAreaopacity = 0;
        window.puzzlePieces.defaultBorderopacity = 0.2;
        window.puzzlePieces.defaultShadowopacity = 0.3;
        window.puzzlePieces.defaultCallback = () => {
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

        this.setState({loaded: false, solved: false, maasObject: null});

        //fetch a random object from the collection
        this.fetchRandomObject();

    }

    fetchRandomObject() {

        //random number of total objects to skip to
        let randomSkip = Math.floor(Math.random() * this.state.totalObjects - 1) + 0;

        //query a random object from the maas api using random skip number based off total
        maasApiClient.query({
            query: gql `query maasAssessment($randomSkip: Int) {
                objects(limit:1, skip: $randomSkip) {
                    title
                    summary
                    mainImage {
                        url
                    }
                    images {
                        url
                    }
                    production {
                        date
                    }
                }
            }`,
            variables: {
                randomSkip: randomSkip
            }
        }).then(response => {

            //check to make sure randomly queried image has title, summary and a main image
            if (response.data.objects[0] && response.data.objects[0].title && response.data.objects[0].summary && response.data.objects[0].mainImage && response.data.objects[0].mainImage.url) {

                console.log('object found');
                console.log(response.data.objects[0]);

                //cleanup old canvas
                this.cleanUpPuzzle();

                //create new dom image
                var puzzleImg = new Image();
                puzzleImg.id = 'puzzle-image';
                puzzleImg.src = response.data.objects[0].mainImage.url;
                document.getElementById('puzzle-container').appendChild(puzzleImg);

                puzzleImg.onload = () => {

                    if (puzzleImg.width > puzzleImg.height) {
                        this.setState({loaded: true, maasObject: response.data.objects[0], tallPuzzleImage: false})
                    } else {
                        this.setState({loaded: true, maasObject: response.data.objects[0], tallPuzzleImage: true})
                    }

                    window.puzzlePieces.add(puzzleImg);

                }

            } else {
                //no object was found or object did not include a main image
                //fetch another object
                this.fetchRandomObject();
            }

        }).catch(error => console.error(error));

    }

    cleanUpPuzzle() {
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
        window.puzzlePieces.solve(document.getElementById('puzzle-image'));
        setTimeout(() => {
            this.puzzleSolved();
        }, 1000)
    }

    puzzleSolved() {
        console.log('puzzle solved');
        //cleanup old canvas
        this.cleanUpPuzzle();
        this.setState({solved: true});
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

                {/* loader */}
                <div id="loading-screen" className={this.state.loaded
                    ? 'loaded'
                    : null}>
                    <div className="sk-cube-grid">
                        <div className="sk-cube sk-cube1"></div>
                        <div className="sk-cube sk-cube2"></div>
                        <div className="sk-cube sk-cube3"></div>
                        <div className="sk-cube sk-cube4"></div>
                        <div className="sk-cube sk-cube5"></div>
                        <div className="sk-cube sk-cube6"></div>
                        <div className="sk-cube sk-cube7"></div>
                        <div className="sk-cube sk-cube8"></div>
                        <div className="sk-cube sk-cube9"></div>
                    </div>

                </div>

                <div className="container">

                    <h1>MAAS Object Discoverer</h1>

                    <p>
                        Put the pieces together and help uncover assorted objects from the MAAS collection.
                    </p>

                    <div className={`game-area ${this.state.solved
                        ? 'solved'
                        : ''}`}>

                        <Row>

                            <Col xs={puzzleWidth} xsOffset={puzzlePush} className="puzzle-col">

                                <div id="puzzle-container" className={this.state.tallPuzzleImage
                                    ? 'tall-puzzle-image'
                                    : ''}>

                                    <img id="puzzle-solved" width="100%" src={this.state.solved && this.state.maasObject
                                        ? this.state.maasObject.mainImage.url
                                        : null} alt="Puzzle"/>

                                </div>

                            </Col>

                            {this.state.solved
                                ? <Col xs={4} className="object-details">
                                        <div className="object-title detail">
                                            {this.state.maasObject
                                                ? this.state.maasObject.title
                                                : null}
                                        </div>
                                        <div className="object-summary detail">
                                            {this.state.maasObject
                                                ? this.state.maasObject.summary
                                                : null}
                                        </div>
                                    </Col>
                                : null}

                        </Row>

                        {!this.state.solved
                            ? <button onClick={this.solvePuzzle}>Solve it for me</button>
                            : null}

                        <button onClick={this.startNewPuzzle}>Find another object!</button>

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

export default App;
