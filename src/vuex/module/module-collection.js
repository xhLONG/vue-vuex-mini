import { forEach } from "../util";
import Module from "./module";

export default class ModuleCollection{
    constructor(options){
        // 注册模块 递归注册
        this.register([], options);
    }

    register(path, rootModule){
        let newModule = new Module(rootModule);
        rootModule.rawModule = newModule;       // 把当前要注册的模块上 做一个映射

        if(path.length == 0){
            this.root = newModule;
            console.log(this.root)
        }else{
            // [index, a]
            let parent = path.slice(0, -1).reduce((memo, current) => {
                return memo.getChild(current);
            }, this.root);
            parent.addChild(path[path.length-1], newModule);
        }

        // 如果有modules说明有子模块
        if(rootModule.modules) {
            forEach(rootModule.modules, (module, moduleName) => {
                this.register([...path, moduleName], module);
            })
        }
    }

    // 获取命名空间
    getNamespace(path){
        let root = this.root;
        return path.reduce((namespaced, key) => {
            root = root.getChild(key);
            return namespaced  + (root.namespaced ? key + "/" : "");
        }, "")

    }
}

// 格式化成树形结构
// this.root = {
//     _raw: xxx,
//     _children: {
//         a: {
//             _raw: xxx,
//             state: a.state,      // 保证是访问当前的state
//         },
//         b: {
//             _raw: xxx,
//             _children: {

//             }
//         }
//     }
// }