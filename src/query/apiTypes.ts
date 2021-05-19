import {
  EndpointDefinitions,
  EndpointBuilder,
  EndpointDefinition,
  ReplaceTagTypes,
} from './endpointDefinitions'
import { UnionToIntersection, Id, NoInfer } from './tsHelpers'
import { CoreModule } from './core/module'
import { CreateApiOptions } from './createApi'
import { BaseQueryFn } from './baseQueryTypes'

export interface ApiModules<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BaseQuery extends BaseQueryFn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Definitions extends EndpointDefinitions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ReducerPath extends string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TagTypes extends string
> {}

export type ModuleName = keyof ApiModules<any, any, any, any>

export type Module<Name extends ModuleName> = {
  name: Name
  init<
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
    ReducerPath extends string,
    TagTypes extends string
  >(
    api: Api<BaseQuery, EndpointDefinitions, ReducerPath, TagTypes, ModuleName>,
    options: Required<
      CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>
    >,
    context: ApiContext<Definitions>
  ): {
    injectEndpoint(
      endpointName: string,
      definition: EndpointDefinition<any, any, any, any>
    ): void
  }
}

export interface ApiContext<Definitions extends EndpointDefinitions> {
  endpointDefinitions: Definitions
  batch(cb: () => void): void
}

export type Api<
  BaseQuery extends BaseQueryFn,
  Definitions extends EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string,
  Enhancers extends ModuleName = CoreModule
> = Id<
  Id<
    UnionToIntersection<
      ApiModules<BaseQuery, Definitions, ReducerPath, TagTypes>[Enhancers]
    >
  > & {
    /**
     * A function to inject the endpoints into the original API, but also give you that same API with correct types for these endpoints back. Useful with code-splitting.
     */
    injectEndpoints<NewDefinitions extends EndpointDefinitions>(_: {
      endpoints: (
        build: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
      ) => NewDefinitions
      overrideExisting?: boolean
    }): Api<
      BaseQuery,
      Definitions & NewDefinitions,
      ReducerPath,
      TagTypes,
      Enhancers
    >
    /**
     *A function to enhance a generated API with additional information. Useful with code-generation.
     */
    enhanceEndpoints<NewTagTypes extends string = never>(_: {
      addTagTypes?: readonly NewTagTypes[]
      endpoints?: ReplaceTagTypes<
        Definitions,
        TagTypes | NoInfer<NewTagTypes>
      > extends infer NewDefinitions
        ? {
            [K in keyof NewDefinitions]?:
              | Partial<NewDefinitions[K]>
              | ((definition: NewDefinitions[K]) => void)
          }
        : never
    }): Api<
      BaseQuery,
      ReplaceTagTypes<Definitions, TagTypes | NewTagTypes>,
      ReducerPath,
      TagTypes | NewTagTypes,
      Enhancers
    >
  }
>

export type ApiWithInjectedEndpoints<
  ApiDefinition extends Api<any, any, any, any>,
  Injections extends ApiDefinition extends Api<infer B, any, infer R, infer E>
    ? [Api<B, any, R, E>, ...Api<B, any, R, E>[]]
    : never
> = Omit<ApiDefinition, 'endpoints'> &
  Omit<Injections, 'endpoints'> & {
    endpoints: ApiDefinition['endpoints'] &
      Partial<UnionToIntersection<Injections[number]['endpoints']>>
  }