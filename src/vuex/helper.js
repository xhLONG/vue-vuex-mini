export const mapState = (arrList) => {
    let obj = {};
    for(let i=0; i< arrList.length; i++){
        let stateName = arrList[i];
        obj[stateName] = function(){
            return this.$store.state[stateName];
        }
    }
    return obj;
}