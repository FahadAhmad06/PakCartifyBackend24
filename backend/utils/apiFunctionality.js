
class APIFunctionality {

    constructor(query, queryStr){
        this.query = query;
        this.querystr = queryStr;
    }

    search() {
        
        const keyword = this.querystr.keyword ? {
            $or:[{
                name : {
                $regex : this.querystr.keyword,
                $options : "i"
            }},{
                description : {
                $regex : this.querystr.keyword,
                $options : "i"
            }},{
                category : {
                $regex : this.querystr.keyword,
                $options : "i"
            }},{
                subcategory : {
                $regex : this.querystr.keyword,
                $options : "i"
            }},{
                brand : {
                $regex : this.querystr.keyword,
                $options : "i"
            }},{
                tag : {
                $regex : this.querystr.keyword,
                $options : "i"
            }
            }
        ]
        }:{};
        this.query = this.query.find({...keyword});
        return this;
    }

    filter() {
        const queryCopy = {...this.querystr};
        const removeFields = ["keyword", "page", "limit"];
        removeFields.forEach(key => delete queryCopy[key]);
        this.query = this.query.find(queryCopy);
        return this;
    }

    pagination(resultPerPage) {
        const currentPage = Number(this.querystr.page) || 1;
        const skip = resultPerPage * (currentPage - 1);
        this.query = this.query.limit(resultPerPage).skip(skip);
        return this;
    }
}

export default APIFunctionality;