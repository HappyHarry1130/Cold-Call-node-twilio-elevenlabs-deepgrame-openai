const tools = [
  // {
  //   type: 'function',
  //   function: {
  //     name: 'checkInventory',
  //     say: 'Let me check our inventory right now.',
  //     description: 'Checks the inventory of different AirPods models: AirPods, AirPods Pro, or AirPods Max.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         model: {
  //           type: 'string',
  //           'enum': ['airpods', 'airpods pro', 'airpods max'],
  //           description: 'The model of AirPods, either AirPods, AirPods Pro, or AirPods Max.',
  //         },
  //       },
  //       required: ['model'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         stock: {
  //           type: 'integer',
  //           description: 'An integer that indicates how many models are currently in stock.'
  //         }
  //       }
  //     }
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: 'checkPrice',
  //     say: 'Let me check the price, one moment.',
  //     description: 'Checks the price of the provided model of AirPods, AirPods Pro, or AirPods Max.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         model: {
  //           type: 'string',
  //           'enum': ['airpods', 'airpods pro', 'airpods max'],
  //           description: 'The model of AirPods, either AirPods, AirPods Pro, or AirPods Max.',
  //         },
  //       },
  //       required: ['model'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         price: {
  //           type: 'integer',
  //           description: 'The price of the model.'
  //         }
  //       }
  //     }
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: 'placeOrder',
  //     say: 'Alright, I will register this in our system.',
  //     description: 'Places an order for a set of AirPods.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         model: {
  //           type: 'string',
  //           'enum': ['airpods', 'airpods pro'],
  //           description: 'The model of AirPods, either regular or Pro.',
  //         },
  //         quantity: {
  //           type: 'integer',
  //           description: 'The number of AirPods to order.',
  //         },
  //       },
  //       required: ['model', 'quantity'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         price: {
  //           type: 'integer',
  //           description: 'The total price of the order, including taxes.'
  //         },
  //         orderNumber: {
  //           type: 'integer',
  //           description: 'The order number associated with the order.'
  //         }
  //       }
  //     }
  //   },
  // },
  {
    type: 'function',
    function: {
      name: 'transferCall',
      say: 'Um momento enquanto transfiro sua ligação.',
      description: 'Transfere o cliente para um agente ao vivo caso ele solicite ajuda de uma pessoa real.',
      parameters: {
        type: 'object',
        properties: {
          callSid: {
            type: 'string',
            description: 'The unique identifier for the active phone call.',
          },
        },
        required: ['callSid'],
      },
      returns: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Indicates whether the customer call was successfully transferred or not.'
          },
        }
      }
    },
  },
];

module.exports = tools;