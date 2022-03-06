interface MyroErrorInterface {
    message: string;
}

export default class MyroError implements MyroErrorInterface {
    constructor(options: MyroErrorInterface) {
        this.message = options.message;
    }
    public message: string;
};