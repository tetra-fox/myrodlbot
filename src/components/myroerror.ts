interface MyroErrorInterface {
    message: string;
}

class MyroError implements MyroErrorInterface {
    constructor(options: MyroErrorInterface) {
        this.message = options.message;
    }
    public message: string;
}

export default MyroError;
